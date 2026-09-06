-- KoCloud cloud sync module.
--
-- Two independent channels, both reusing KOReader's cloud storage
-- SyncService (WebDAV / Dropbox):
--
--   1. Annotations  (settings key "highlight_sync", carried over from the
--      former HighlightSync plugin so existing configs keep working):
--      per-book JSON carrier of annotation arrays, three-way merged with the
--      SyncService cached copy. Deterministic persistence: merged results are
--      written back through KOReader's own DocSettings writer (with a .bak of
--      the previous metadata file).
--
--   2. Reading progress (settings key "kocloud_progress"): per-book carrier
--      with {percent, doc_pages, status, updated}. Three-way diff via the
--      cached copy; single-side changes flow automatically, genuine conflicts
--      (both sides moved) are resolved by the configured preference
--      ("later" = bigger percent, "earlier" = smaller percent).
--
-- A small job runner lets the KOReader menu, reader events and the web UI
-- trigger syncs on either channel without stepping on each other.
local logger = require("logger")
local lfs = require("libs/libkoreader-lfs")
local UIManager = require("ui/uimanager")
local DocSettings = require("docsettings")
local DataLoader = require("dataloader")

local sync_ok, SyncService = pcall(require, "frontend/apps/cloudstorage/syncservice")
local json_ok, rapidjson = pcall(require, "rapidjson")
if not sync_ok then
    logger.warn("KoCloud: cloudstorage syncservice unavailable")
end

local Sync = {}

Sync.SETTINGS_KEY = "highlight_sync" -- annotations channel (legacy key)
Sync.PROGRESS_KEY = "kocloud_progress" -- progress channel

Sync.default_settings = {
    is_enabled = true,
    sync_on_open = false,
    sync_on_close = false,
    sync_on_resume = false,
    sync_server = nil,
}

Sync.progress_defaults = {
    server = nil,
    auto = { open = false, close = false, resume = false },
    conflict = "later", -- "later" | "earlier"
}

function Sync.available()
    return sync_ok and SyncService ~= nil and json_ok and rapidjson ~= nil
end

function Sync.getSettings()
    local s = G_reader_settings:readSetting(Sync.SETTINGS_KEY)
    if type(s) ~= "table" then
        s = {}
        for k, v in pairs(Sync.default_settings) do s[k] = v end
    end
    return s
end

function Sync.saveSettings(s)
    G_reader_settings:saveSetting(Sync.SETTINGS_KEY, s)
end

function Sync.isConfigured()
    local s = Sync.getSettings()
    return Sync.available() and s.is_enabled and type(s.sync_server) == "table"
end

function Sync.getProgressSettings()
    local p = G_reader_settings:readSetting(Sync.PROGRESS_KEY)
    if type(p) ~= "table" then
        p = {}
        for k, v in pairs(Sync.progress_defaults) do
            if type(v) == "table" then
                p[k] = {}
                for k2, v2 in pairs(v) do p[k][k2] = v2 end
            else
                p[k] = v
            end
        end
    end
    return p
end

function Sync.saveProgressSettings(p)
    G_reader_settings:saveSetting(Sync.PROGRESS_KEY, p)
end

function Sync.isProgressConfigured()
    local p = Sync.getProgressSettings()
    return Sync.available() and type(p.server) == "table"
end

function Sync.readableServerPath(server)
    if not Sync.available() or not server then return nil end
    local f = SyncService.getReadablePath
    if type(f) == "function" then
        local ok, res = pcall(f, server)
        if ok then return res end
    end
    return nil
end

-------------------------------------------------------------------------------
-- Carrier JSON I/O
-------------------------------------------------------------------------------

-- rapidjson cannot encode non-contiguous integer keys; KOReader `ext`
-- sub-tables use such keys, so stringify before encoding and restore after.
local function stringify_ext_keys(annotations)
    local out = {}
    for i, ann in ipairs(annotations) do
        if type(ann) == "table" and type(ann.ext) == "table" then
            local copy = {}
            for k, v in pairs(ann) do copy[k] = v end
            local ext = {}
            for k, v in pairs(ann.ext) do ext[tostring(k)] = v end
            copy.ext = ext
            out[i] = copy
        else
            out[i] = ann
        end
    end
    return out
end

local function destringify_ext_keys(annotations)
    for _, ann in ipairs(annotations) do
        if type(ann) == "table" and type(ann.ext) == "table" then
            local ext = {}
            for k, v in pairs(ann.ext) do
                ext[tonumber(k) or k] = v
            end
            ann.ext = ext
        end
    end
end

local function read_json_array(path)
    local f = io.open(path, "rb")
    if not f then return nil, false end -- missing file is normal
    local content = f:read("*all")
    f:close()
    if not content or content == "" then return nil, false end -- empty ~ missing
    local ok, data = pcall(rapidjson.decode, content)
    if not ok or type(data) ~= "table" then return nil, true end -- corrupt
    destringify_ext_keys(data)
    return data, false
end

local function write_json_array(path, annotations)
    local f = io.open(path, "w")
    if not f then return false end
    f:write(rapidjson.encode(stringify_ext_keys(annotations)))
    f:close()
    return true
end

-------------------------------------------------------------------------------
-- Sidecar helpers
-------------------------------------------------------------------------------

local function annotations_hash(ds_data)
    local anns = ds_data and ds_data.annotations
    return type(anns) == "table" and anns or {}
end

-- Stable per-highlight key: pos0|pos1 when available (device independent),
-- else page + text prefix.
local function ann_key(ann)
    if ann and ann.pos0 and ann.pos1 then
        if type(ann.pos0) == "table" or type(ann.pos1) == "table" then
            return tostring(ann.pos0) .. "|" .. tostring(ann.pos1)
        end
        return tostring(ann.pos0) .. "|" .. tostring(ann.pos1)
    end
    local text = (ann and ann.text) or ""
    return tostring(ann and ann.page or "?") .. "|" .. tostring(#text) .. ":" .. text:sub(1, 20)
end

local function hash_to_array(hash)
    local list = {}
    for _, v in pairs(hash or {}) do
        if type(v) == "table" then
            list[#list + 1] = v
        end
    end
    return list
end

-- First metadata.*.lua inside a sidecar dir (same glob dataloader uses).
local function metadata_file_in(dir)
    if not dir or lfs.attributes(dir, "mode") ~= "directory" then return nil end
    for entry in lfs.dir(dir) do
        if entry:match("^metadata%..*%.lua$") and not entry:match("%.old$") then
            return dir .. "/" .. entry
        end
    end
    return nil
end

local function sidecar_dir_for(doc_path)
    if not doc_path then return nil end
    local cands = DataLoader:getSidecarCandidates(doc_path)
    return cands and cands[1] or nil
end

local function ensure_dir(path)
    if not path or path == "" then return false end
    if lfs.attributes(path, "mode") == "directory" then return true end
    local parent = path:match("^(.*)/[^/]+$")
    if parent and parent ~= "" and lfs.attributes(parent, "mode") ~= "directory" then
        ensure_dir(parent)
    end
    local ok = lfs.mkdir(path)
    return ok or lfs.attributes(path, "mode") == "directory"
end

-------------------------------------------------------------------------------
-- Annotation merge (ported from upstream merge.lua, same semantics)
-------------------------------------------------------------------------------

local function parse_datetime_cached()
    local cache = {}
    return function(str)
        if not str then return 0 end
        if cache[str] then return cache[str] end
        local y, mo, d, h, mi, s = str:match("(%d+)-(%d+)-(%d+) (%d+):(%d+):(%d+)")
        if not y then return 0 end
        cache[str] = os.time{ year = tonumber(y), month = tonumber(mo), day = tonumber(d),
                              hour = tonumber(h), min = tonumber(mi), sec = tonumber(s) }
        return cache[str]
    end
end
local parse_datetime = parse_datetime_cached()

local function ann_datetime(ann)
    return ann and (ann.datetime_updated or ann.datetime)
end

local function newer_of(a, b)
    local ta = parse_datetime(ann_datetime(a))
    local tb = parse_datetime(ann_datetime(b))
    return (ta >= tb) and a or b
end

-- Three-way merge over annotation arrays. Deletion propagates via the
-- last-sync set: an item present there but missing on one side counts as
-- deleted on that side and is not resurrected from the other.
function Sync.mergeAnnotations(local_list, server_list, last_sync_list)
    local local_map, server_map, last_map = {}, {}, {}
    local function index(map, list)
        for _, ann in ipairs(list or {}) do
            if type(ann) == "table" then
                map[ann_key(ann)] = ann
            end
        end
    end
    index(local_map, local_list)
    index(server_map, server_list)
    index(last_map, last_sync_list)

    local merged = {}
    for key, local_ann in pairs(local_map) do
        if not (server_map[key] == nil and last_map[key] ~= nil) then
            merged[key] = local_ann
        end
    end
    for key, server_ann in pairs(server_map) do
        if last_map[key] ~= nil and local_map[key] == nil then
            -- deleted locally; ignore the server copy
        elseif not local_map[key] then
            merged[key] = server_ann
        else
            merged[key] = newer_of(server_ann, local_map[key])
        end
    end

    local out = {}
    for _, ann in pairs(merged) do
        out[#out + 1] = ann
    end
    table.sort(out, function(a, b)
        local pa, pb = tonumber(a.pageno or 0), tonumber(b.pageno or 0)
        if pa ~= pb then return pa < pb end
        local a0, b0 = a.pos0, b.pos0
        if type(a0) == "table" and type(b0) == "table" then
            return (a0.y or 0) < (b0.y or 0) or ((a0.y or 0) == (b0.y or 0) and (a0.x or 0) < (b0.x or 0))
        end
        if type(a0) == "table" then return true end
        if type(b0) == "table" then return false end
        return (a0 or 0) < (b0 or 0)
    end)
    return out
end

-------------------------------------------------------------------------------
-- Metadata write-back (annotation channel)
-------------------------------------------------------------------------------

-- Write merged annotations back into the book's own metadata via KOReader's
-- DocSettings writer. Pre-existing keys are preserved so KOReader keeps
-- stable identities; cloud-only items get a derived key. A .bak of the
-- previous metadata file is kept and restored on failure.
local function write_annotations_hash(ds, merged, doc_path)
    local old = annotations_hash(ds.data)
    local result = {}
    local key_by_pos = {}
    for k, v in pairs(old) do
        if type(v) == "table" then
            key_by_pos[ann_key(v)] = k
        end
    end
    for _, ann in ipairs(merged or {}) do
        if type(ann) == "table" then
            local key = key_by_pos[ann_key(ann)]
            result[key or ("cloud|" .. ann_key(ann))] = ann
        end
    end
    ds.data.annotations = result

    -- Locate the ACTUAL metadata file KOReader would read/write (may live in
    -- the docsettings dir for migrated/read-only books), backup it to .bak,
    -- flush via DocSettings, and remove the backup only after success.
    local meta = nil
    if type(ds.findSidecarFile) == "function" then
        local okf, fpath = pcall(ds.findSidecarFile, ds, doc_path)
        if okf and type(fpath) == "string" then meta = fpath end
    end
    if not meta then
        -- fallback: first existing metadata.*.lua in the sidecar dirs
        for _, dir in ipairs({ ds.doc_sidecar_dir, ds.dir_sidecar_dir, ds.hash_sidecar_dir }) do
            local f = dir and metadata_file_in(dir) or nil
            if f then meta = f break end
        end
    end
    local bak = meta and (meta .. ".bak") or nil
    if meta and lfs.attributes(meta, "mode") == "file" then
        pcall(os.remove, bak) -- clear stale backup so rename cannot fail
        pcall(os.rename, meta, bak)
    end
    local written_dir = ds:flush()
    if not written_dir then
        logger.err("KoCloud: failed to flush merged annotations")
        if bak and lfs.attributes(bak, "mode") == "file" then
            pcall(os.rename, bak, meta)
        end
        return false
    end
    -- success: keep one rolling .bak (last good copy, replaced next sync)
    logger.info("KoCloud: merged annotations saved to",
        written_dir .. "/" .. (ds.sidecar_filename or "metadata.lua"))
    return true
end

-------------------------------------------------------------------------------
-- Annotation channel: per-book sync
-------------------------------------------------------------------------------

-- Sync one book's annotations. live_annotations (open reader) wins over disk.
-- opts.apply_live: fn(merged_array) -> bool for the open-book case (inject
-- into the live reader state). opts.sidecar_dir overrides the carrier dir.
function Sync.syncBook(doc_path, live_annotations, opts)
    opts = opts or {}
    if not Sync.isConfigured() then return nil, "no cloud server configured" end
    if not doc_path or lfs.attributes(doc_path, "mode") ~= "file" then
        return nil, "book file not found"
    end
    local server = Sync.getSettings().sync_server
    local live = type(live_annotations) == "table"
    if live and type(opts.apply_live) ~= "function" then
        return nil, "live book requires apply_live callback"
    end

    local ds = nil
    local local_list
    if live then
        local_list = hash_to_array(live_annotations)
    else
        local ok_ds, ds_or_err = pcall(DocSettings.open, DocSettings, doc_path)
        if not ok_ds or type(ds_or_err) ~= "table" then
            return nil, "cannot open book settings"
        end
        ds = ds_or_err
        local_list = hash_to_array(annotations_hash(ds.data))
        if #local_list == 0 then
            pcall(function() ds:close() end)
            return nil, "no annotations"
        end
    end

    local sidecar_dir = opts.sidecar_dir or sidecar_dir_for(doc_path)
    if not sidecar_dir then
        if ds then pcall(function() ds:close() end) end
        return nil, "cannot resolve sidecar dir"
    end
    if not ensure_dir(sidecar_dir) then
        if ds then pcall(function() ds:close() end) end
        return nil, "cannot create sidecar dir"
    end
    local dir_name = sidecar_dir:match("([^/]+)/*$") or "annotations"
    -- Remote filename must stay unique across devices: two books in different
    -- folders with the same sidecar dir name would otherwise collide (SyncService
    -- names the remote file after the local basename). Hash the dir into the name.
    local dir_hash = ""
    do
        local h = 0
        for i = 1, #sidecar_dir do h = (h * 131 + sidecar_dir:byte(i)) % 4294967296 end
        dir_hash = string.format("-%08x", h)
    end
    local carrier = sidecar_dir .. "/" .. dir_name:gsub("[^%w%.%-%_]", "_") .. dir_hash .. ".json"
    if not write_json_array(carrier, local_list) then
        if ds then pcall(function() ds:close() end) end
        return nil, "cannot write sync file"
    end

    local ok_sync = false
    local ok, err = pcall(function()
        SyncService.sync(server, carrier, function(local_path, cached_path, income_path)
            local local_carrier, c1 = read_json_array(local_path)
            local cached = read_json_array(cached_path)
            local incoming = read_json_array(income_path)
            if c1 then
                -- Only a corrupt LOCAL carrier is fatal (treating it as empty
                -- would look like a full local deletion and clear the shared
                -- state). Cached/remote copies may be left non-JSON by the
                -- provider (e.g. a 404 body) and are treated as absent here.
                logger.warn("KoCloud: corrupt local sync carrier, skipping book")
                return false
            end
            cached = cached or {}
            incoming = incoming or {}
            local local_list = local_carrier or {}
            local merged = Sync.mergeAnnotations(local_list, incoming, cached)
            write_json_array(local_path, merged) -- keep the carrier current
            if opts.apply_live then
                ok_sync = opts.apply_live(merged) or false
            else
                ok_sync = write_annotations_hash(ds, merged, doc_path)
            end
            return ok_sync
        end, opts.silent)
    end)
    if ds then pcall(function() ds:close() end) end
    if not ok then
        return nil, err or "sync failed"
    end
    return ok_sync
end

-------------------------------------------------------------------------------
-- Progress channel
-------------------------------------------------------------------------------

local function progress_payload(ds)
    local d = ds.data or {}
    return {
        percent = tonumber(d.percent_finished) or 0,
        doc_pages = tonumber(d.doc_pages) or 0,
        xp = type(d.last_xpointer) == "string" and d.last_xpointer or nil,
        status = (d.summary and d.summary.status) or d.status or "reading",
        updated = os.time(),
    }
end

local function payload_percent(p)
    return tonumber(p and p.percent) or 0
end

-- Merge local/server/cached progress payloads. Returns the chosen payload or
-- nil when nothing changed this round.
local function merge_progress(local_p, server_p, cached_p, conflict)
    local l = payload_percent(local_p)
    local sv = payload_percent(server_p)
    local c = payload_percent(cached_p)
    if c == 0 and l == 0 and sv == 0 then return nil end
    if l == sv then return nil end
    if c == 0 then
        -- first sync for this book: empty side defers to the side with
        -- progress; when both sides have progress, apply the preference
        -- ("later" picks the bigger percent, "earlier" the smaller).
        if l == 0 then return server_p end
        if sv == 0 then return local_p end
        if conflict == "earlier" then
            return (l < sv) and local_p or server_p
        end
        return (l > sv) and local_p or server_p
    end
    local local_changed = l ~= c
    local server_changed = sv ~= c
    if local_changed and not server_changed then return local_p end
    if server_changed and not local_changed then return server_p end
    if not local_changed and not server_changed then return nil end
    -- genuine conflict: both moved away from the cached value
    if conflict == "earlier" then
        return (l < sv) and local_p or server_p
    end
    return (l > sv) and local_p or server_p
end

local function apply_progress_payload(ds, payload)
    local d = ds.data
    local pct = payload_percent(payload)
    d.percent_finished = pct
    if type(d.summary) == "table" then
        d.summary.percent_finished = pct
    end
    if payload.doc_pages then d.doc_pages = tonumber(payload.doc_pages) or d.doc_pages end
    if payload.status then
        if type(d.summary) == "table" then d.summary.status = payload.status end
        d.status = payload.status
    end
    -- Marker for the next book open: ask whether to jump to the synced
    -- progress (closed-book sync cannot move the reader itself).
    d.kocloud_pending_percent = pct
    return ds:flush() ~= nil
end

-- Sync reading progress of one book. opts.sidecar_dir and opts.apply_progress
-- (open reader UI: fn(percent, payload)) behave like the annotation channel.
function Sync.syncBookProgress(doc_path, opts)
    opts = opts or {}
    if not Sync.isProgressConfigured() then return nil, "no progress cloud configured" end
    if not doc_path or lfs.attributes(doc_path, "mode") ~= "file" then
        return nil, "book file not found"
    end
    local p = Sync.getProgressSettings()
    local server = p.server

    local ds = nil
    local ok_ds, ds_or_err = pcall(DocSettings.open, DocSettings, doc_path)
    if not ok_ds or type(ds_or_err) ~= "table" then
        return nil, "cannot open book settings"
    end
    ds = ds_or_err

    local sidecar_dir = opts.sidecar_dir or sidecar_dir_for(doc_path)
    if not sidecar_dir then
        pcall(function() ds:close() end)
        return nil, "cannot resolve sidecar dir"
    end
    if not ensure_dir(sidecar_dir) then
        pcall(function() ds:close() end)
        return nil, "cannot create sidecar dir"
    end
    local dir_name = sidecar_dir:match("([^/]+)/*$") or "annotations"
    local dir_hash = ""
    do
        local h = 0
        for i = 1, #sidecar_dir do h = (h * 131 + sidecar_dir:byte(i)) % 4294967296 end
        dir_hash = string.format("-%08x", h)
    end
    local carrier = sidecar_dir .. "/" .. dir_name:gsub("[^%w%.%-%_]", "_") .. dir_hash .. ".progress.json"
    if type(opts.live_xp) == "string" then
        local live = progress_payload(ds)
        live.xp = opts.live_xp
        local ok_w = write_json_array(carrier, { live })
        if not ok_w then
            pcall(function() ds:close() end)
            return nil, "cannot write progress file"
        end
    else
        local ok_w = write_json_array(carrier, { progress_payload(ds) })
        if not ok_w then
            pcall(function() ds:close() end)
            return nil, "cannot write progress file"
        end
    end

    local ok_sync = false
    local perr = pcall(function()
        SyncService.sync(server, carrier, function(local_path, cached_path, income_path)
            local function read_payload(fpath)
                local arr = read_json_array(fpath) -- corrupt remote/cached ~ absent
                return arr and arr[1] or nil
            end
            local local_arr, local_corrupt = read_json_array(local_path)
            if local_corrupt then
                logger.warn("KoCloud: corrupt local progress carrier, skipping book")
                return false
            end
            local local_p = local_arr and local_arr[1] or nil
            local cached_p = read_payload(cached_path)
            local server_p = read_payload(income_path)
            if not server_p then server_p = cached_p end
            local chosen = merge_progress(local_p, server_p, cached_p, p.conflict or "later")
            if chosen and chosen ~= local_p then
                write_json_array(local_path, { chosen })
            end
            if chosen then
                if opts.apply_progress then
                    ok_sync = opts.apply_progress(payload_percent(chosen), chosen) or false
                else
                    ok_sync = apply_progress_payload(ds, chosen)
                end
            else
                ok_sync = true
            end
            return ok_sync
        end, opts.silent)
    end)
    pcall(function() ds:close() end)
    if not perr then return nil, "sync error" end
    return ok_sync
end

-------------------------------------------------------------------------------
-- Shared job runner (menu / reader events / web API)
-------------------------------------------------------------------------------

Sync.job = {
    id = 0,
    running = false,
    cancelled = false,
    kind = nil,
    total = 0,
    done = 0,
    ok = 0,
    skipped = 0,
    failed = 0,
    current = "",
    errors = {},
    started_at = nil,
    finished_at = nil,
}

function Sync.isBusy()
    return Sync.job.running
end

-- Ask a running job to stop at the next book boundary (called on suspend /
-- widget close so a background sync cannot keep waking the UI).
function Sync.cancelJob()
    Sync.job.cancelled = true
    Sync.job.running = false
    Sync.job.finished_at = os.time()
end

function Sync.isCancelled()
    return Sync.job.cancelled
end

function Sync.jobStatus()
    local j = Sync.job
    return {
        running = j.running,
        kind = j.kind,
        total = j.total,
        done = j.done,
        ok = j.ok,
        skipped = j.skipped,
        failed = j.failed,
        current = j.current,
        errors = j.errors,
        started_at = j.started_at,
        finished_at = j.finished_at,
    }
end

local function books_with_metadata()
    local out = {}
    for _, b in ipairs(DataLoader:getBooks() or {}) do
        local dir = sidecar_dir_for(b.file)
        if dir and metadata_file_in(dir) then
            table.insert(out, b)
        end
    end
    return out
end

-- Books that have annotations (annotation channel).
function Sync.syncableBooks()
    return books_with_metadata()
end

-- Progress channel syncs the same book set.
function Sync.progressSyncableBooks()
    return books_with_metadata()
end

-- Start a job stepping through books on the UI loop (per-channel runner).
-- channel: "annotations" | "progress". live/sidecar opts only used for the
-- single-book "current" action, so batch jobs pass nil and sync closed books.
function Sync.startJob(channel, silent)
    if Sync.isBusy() then return false end
    local books = books_with_metadata()
    local j = Sync.job
    j.id = j.id + 1
    j.running = true
    j.cancelled = false
    j.kind = channel
    j.total = #books
    j.done = 0
    j.ok = 0
    j.skipped = 0
    j.failed = 0
    j.current = ""
    j.errors = {}
    j.started_at = os.time()
    j.finished_at = nil

    local fn = channel == "progress" and Sync.syncBookProgress or Sync.syncBook
    local i = 0
    local step
    step = function()
        if j.cancelled then
            j.running = false
            j.current = ""
            j.finished_at = j.finished_at or os.time()
            return
        end
        i = i + 1
        if i > #books then
            j.running = false
            j.current = ""
            j.finished_at = os.time()
            return
        end
        local book = books[i]
        j.current = book.title or ""
        local okp, ok, err = pcall(fn, book.file, nil, { silent = true })
        if not okp then
            j.failed = j.failed + 1
            if #j.errors < 5 then
                table.insert(j.errors, (book.title or "?") .. ": " .. tostring(err))
            end
        elseif ok then
            j.ok = j.ok + 1
        elseif err == "no annotations" or err == "book file not found" then
            j.skipped = j.skipped + 1
        else
            j.failed = j.failed + 1
            if #j.errors < 5 then
                table.insert(j.errors, (book.title or "?") .. ": " .. tostring(err))
            end
        end
        j.done = j.done + 1
        if not j.cancelled then
            UIManager:scheduleIn(0.01, step)
        end
    end
    UIManager:scheduleIn(0.01, step)
    return true
end



-- Cover cache backup / restore
-------------------------------------------------------------------------------
-- Covers are a regenerable cache: all files under the covers dir are packed
-- into ONE self-describing container ("name|offset|length" index + raw bytes,
-- no compression) and pushed through SyncService.sync. Backup keeps the local
-- container as source of truth; restore pulls the remote one and unpacks it
-- over the local covers dir.
local DataStorage = require("datastorage")

local COVERS_FILE = "kodashboard-covers.bin"

local function covers_dir()
    return (DataStorage:getDataDir() or ".") .. "/kodashboard/covers"
end

local function pack_covers_into(path)
    local dir = covers_dir()
    if lfs.attributes(dir, "mode") ~= "directory" then return false, "no covers dir" end
    local entries = {}
    for entry in lfs.dir(dir) do
        local fpath = dir .. "/" .. entry
        if entry ~= "." and entry ~= ".." and lfs.attributes(fpath, "mode") == "file" then
            entries[#entries + 1] = { name = entry, path = fpath }
        end
    end
    if #entries == 0 then return false, "no covers to backup" end
    table.sort(entries, function(a, b) return a.name < b.name end)
    local index = {}
    local offset = 0
    for _, e in ipairs(entries) do
        index[#index + 1] = string.format("%s|%d|%d", e.name, offset, lfs.attributes(e.path, "size") or 0)
        offset = offset + (lfs.attributes(e.path, "size") or 0)
    end
    local out = io.open(path, "wb")
    if not out then return false, "cannot write cover pack" end
    out:write("KDCOVER1\n")
    out:write(table.concat(index, "\n") .. "\n\n")
    for _, e in ipairs(entries) do
        local f = io.open(e.path, "rb")
        if f then
            out:write(f:read("*a"))
            f:close()
        end
    end
    out:close()
    return true, nil, #entries
end

local function unpack_covers_from(path)
    local f = io.open(path, "rb")
    if not f then return false, "cover pack not found" end
    local content = f:read("*a")
    f:close()
    local magic, rest = content:match("^KDCOVER1\n(.*)$")
    if not magic then return false, "invalid cover pack" end
    local index_text, payload = rest:match("^(.-)\n\n(.*)$")
    if not index_text then return false, "invalid cover pack" end
    local dir = covers_dir()
    if lfs.attributes(dir, "mode") ~= "directory" then
        if not lfs.mkdir(dir) and lfs.attributes(dir, "mode") ~= "directory" then
            return false, "cannot create covers dir"
        end
    end
    local count = 0
    for line in index_text:gmatch("[^\n]+") do
        local name, offset, length = line:match("^(.-)|(%d+)|(%d+)$")
        if name and offset and length then
            -- reject path separators / traversal and out-of-bounds ranges
            local safe_name = name:match("^([^/\\]+)$")
            local off, len = tonumber(offset), tonumber(length)
            if safe_name and safe_name ~= "." and safe_name ~= ".."
                and off and len and off >= 0 and len >= 0 and off + len <= #payload then
                local bytes = payload:sub(off + 1, off + len)
                local out = io.open(dir .. "/" .. safe_name, "wb")
                if out then
                    out:write(bytes)
                    out:close()
                    count = count + 1
                end
            end
        end
    end
    return true, nil, count
end

local function syncContainerFile(path, keep_local, silent)
    if not Sync.isConfigured() then return nil, "no cloud server configured" end
    local server = Sync.getSettings().sync_server
    local ok = false
    local perr = pcall(function()
        SyncService.sync(server, path, function(local_path, cached_path, income_path)
            if not keep_local then
                local income = io.open(income_path, "rb")
                if income then
                    local data = income:read("*a")
                    income:close()
                    if data and #data > 0 then
                        local out = io.open(local_path, "wb")
                        if out then out:write(data) out:close() end
                    end
                end
            end
            ok = true
            return true
        end, silent)
    end)
    if not perr then return nil, "sync error" end
    return ok
end

-- Backup the cover cache (annotations cloud channel server is used).
function Sync.backupCovers(silent)
    local dir = covers_dir()
    if lfs.attributes(dir, "mode") ~= "directory" then
        return nil, "no covers dir yet"
    end
    local tmp = dir .. "/" .. COVERS_FILE .. ".tmp"
    local ok_pack, msg = pack_covers_into(tmp)
    if not ok_pack then return nil, msg end
    local target = dir .. "/" .. COVERS_FILE
    pcall(os.rename, tmp, target)
    local ok_sync = syncContainerFile(target, true, silent)
    if not ok_sync then return nil, "backup upload failed" end
    return true
end

-- Restore the cover cache from the cloud (overwrites local covers).
function Sync.restoreCovers(silent)
    local dir = covers_dir()
    if lfs.attributes(dir, "mode") ~= "directory" then
        lfs.mkdir(dir)
    end
    local target = dir .. "/" .. COVERS_FILE
    local f = io.open(target, "wb")
    if f then f:write("KDCOVER1\n\n") f:close() end
    local ok_sync = syncContainerFile(target, false, silent)
    if not ok_sync then return nil, "restore download failed" end
    local ok_unpack, msg, count = unpack_covers_from(target)
    if not ok_unpack then return nil, msg end
    os.remove(target)
    return true, count
end

-- Single-shot cover job through the shared job state (web polls it).
function Sync.startCoverJob(kind)
    if Sync.isBusy() then return false end
    local j = Sync.job
    j.id = j.id + 1
    j.running = true
    j.cancelled = false
    j.kind = kind -- "covers-backup" | "covers-restore"
    j.total = 1
    j.done = 0
    j.ok = 0
    j.skipped = 0
    j.failed = 0
    j.current = ""
    j.errors = {}
    j.started_at = os.time()
    j.finished_at = nil
    UIManager:scheduleIn(0.01, function()
        local fn = kind == "covers-restore" and Sync.restoreCovers or Sync.backupCovers
        local okp, ok, msg = pcall(fn, true)
        j.done = 1
        j.finished_at = os.time()
        j.running = false
        if okp and ok then
            j.ok = 1
        else
            j.failed = 1
            j.errors = { msg or "cover sync failed" }
        end
    end)
    return true
end

return Sync

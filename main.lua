local Device = require("device")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local QRMessage = require("ui/widget/qrmessage")
local Event = require("ui/event")
local logger = require("logger")
local util = require("util")
local NetworkMgr = require("ui/network/manager")
local _ = require("gettext")
local T = require("ffi/util").template

-- KOReader only loads l10n/<lang>/koreader.mo at runtime, so standalone
-- plugins must inject their own translations into the global gettext catalog.
-- We parse our own .po directly: no gettext toolchain needed on device, and
-- the .po stays the single source of truth (editable on the device itself).
-- Only msgstr / msgstr[0] (plural form 0) entries are handled; Chinese has a
-- single plural form, so that covers zh_CN. Runs at module load time so that
-- _meta.lua (dofile'd after main.lua) is translated too.
local GetText = require("gettext")
do
    local plugin_dir = (debug.getinfo(1, "S").source or ""):match("@(.*/)") or "."
    local lang = GetText.current_lang or ""
    local po_path = plugin_dir .. "l10n/" .. lang .. "/kocloud.po"
    local f = io.open(po_path, "rb")
    if f then
        local content = f:read("*all")
        f:close()
        local function unescape(s)
            return (s:gsub("\\n", "\n"):gsub("\\t", "\t"):gsub('\\"', '"'):gsub("\\\\", "\\"))
        end
        local msgid, msgstr, plural
        local function flush()
            if msgid and msgid ~= "" and msgstr and msgstr ~= "" then
                local key = unescape(msgid)
                local val = unescape(msgstr)
                if plural then
                    local forms = GetText.translation[key]
                    if type(forms) ~= "table" then forms = {}; GetText.translation[key] = forms end
                    forms[plural] = val
                else
                    GetText.translation[key] = val
                end
            end
            msgid, msgstr, plural = nil, nil, nil
        end
        for line in content:gmatch("[^\r\n]+") do
            local id = line:match('^msgid%s+"(.*)"$')
            local str = line:match('^msgstr%s+"(.*)"$')
            local str_idx, str_val = line:match('^msgstr%s*%[%s*(%d+)%s*%]%s+"(.*)"$')
            local cont = line:match('^"(.*)"$')
            if id then
                flush()
                msgid = id
            elseif str_idx then
                plural = tonumber(str_idx)
                msgstr = str_val
            elseif str then
                msgstr = str
            elseif cont then
                if msgid then
                    if not msgstr then msgid = msgid .. cont
                    else msgstr = msgstr .. cont end
                end
            end
        end
        flush()
    end
end

local Sync = require("sync")

-- Mount the fancy highlight styles (reader-side rendering enhancement) at
-- startup. Failure must never break the rest of the plugin.
local ok_styles, styles_err = pcall(require, "highlightstyles")
if not ok_styles then
    logger.warn("KoCloud: fancy highlight styles mount failed:", styles_err)
end

-- Module-level guard: reloadDocument() closes the current ReaderUI and creates a
-- fresh plugin instance, so a per-instance flag would be lost and auto-sync
-- would reload forever. The flag must survive across instances.
local kocloud_reloading = false

local KoCloud = WidgetContainer:extend{
    name = "KoCloud",
    is_doc_only = false,
}

local HTTP_RESPONSE_CODE = {
    [200] = "OK",
    [302] = "Found",
    [404] = "Not Found",
    [405] = "Method Not Allowed",
    [500] = "Internal Server Error",
}

local CTYPE = {
    CSS  = "text/css",
    HTML = "text/html",
    JS   = "application/javascript",
    JSON = "application/json",
    PNG  = "image/png",
    TEXT = "text/plain",
}

local EXT_TO_CTYPE = {
    [".html"] = CTYPE.HTML,
    [".css"]  = CTYPE.CSS,
    [".js"]   = CTYPE.JS,
    [".json"] = CTYPE.JSON,
    [".png"]  = CTYPE.PNG,
    [".svg"]  = "image/svg+xml",
}

function KoCloud:init()
    self.port = G_reader_settings:readSetting("kodashboard_port", "8686")
    self:onDispatcherRegisterActions()
    self.ui.menu:registerToMainMenu(self)
end

-- Make KoCloud actions available to KOReader's own action system
-- (gesture actions / menu “edit actions” lists), like other plugins.
function KoCloud:onDispatcherRegisterActions()
    local Dispatcher = require("dispatcher")
    Dispatcher:registerAction("kocloud_sync_annotations", {
        category = "none",
        event = "KoCloudSyncAnnotations",
        title = _("Sync annotations now"),
        help = _("Sync the current book's annotations with the cloud."),
        general = true,
    })
    Dispatcher:registerAction("kocloud_sync_progress", {
        category = "none",
        event = "KoCloudSyncProgress",
        title = _("Sync reading progress now"),
        help = _("Sync the current book's reading progress with the cloud."),
        general = true,
    })
end

function KoCloud:onKoCloudSyncAnnotations()
    self:dispatcherSync("annotations")
end

function KoCloud:onKoCloudSyncProgress()
    self:dispatcherSync("progress")
end

-- Shared guard for gesture-triggered syncs.
function KoCloud:dispatcherSync(channel)
    if not self.document or not self.document.file then return end
    local configured = channel == "progress"
        and Sync.isProgressConfigured() or Sync.isConfigured()
    if not configured then
        local InfoMessage = require("ui/widget/infomessage")
        UIManager:show(InfoMessage:new{
            text = _("KoCloud cloud sync is not configured yet. Set it up in Tools → KoCloud."),
            timeout = 3,
        })
        return
    end
    if Sync.isBusy() then return end
    self:syncCurrentBook(channel, true)
end

function KoCloud:isRunning()
    return self.http_socket ~= nil
end

function KoCloud:onEnterStandby()
    if self:isRunning() then self:stop() end
end

function KoCloud:onSuspend()
    if self:isRunning() then self:stop() end
end

function KoCloud:onExit()
    if self:isRunning() then self:stop() end
end

function KoCloud:onCloseWidget()
    if self:isRunning() then self:stop() end
end

function KoCloud:start()
    logger.dbg("KoCloud: Starting server...")

    if Device:isKindle() then
        os.execute(string.format(
            "iptables -A INPUT -p tcp --dport %s -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT",
            self.port))
        os.execute(string.format(
            "iptables -A OUTPUT -p tcp --sport %s -m conntrack --ctstate ESTABLISHED -j ACCEPT",
            self.port))
    end

    local ServerClass = require("ui/message/simpletcpserver")
    self.http_socket = ServerClass:new{
        host = "*",
        port = self.port,
        receiveCallback = function(data, id) return self:onRequest(data, id) end,
    }
    local ok, err = self.http_socket:start()
    if ok then
        self.http_messagequeue = UIManager:insertZMQ(self.http_socket)
        logger.dbg("KoCloud: Server listening on port " .. self.port)
    else
        logger.err("KoCloud: Failed to start server:", err)
        self.http_socket = nil
        local InfoMessage = require("ui/widget/infomessage")
        UIManager:show(InfoMessage:new{
            text = T(_("Failed to start KoCloud on port %1."), self.port) .. "\n\n" .. err,
        })
    end
end

function KoCloud:stop()
    logger.dbg("KoCloud: Stopping server...")

    if Device:isKindle() then
        os.execute(string.format(
            "iptables -D INPUT -p tcp --dport %s -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT",
            self.port))
        os.execute(string.format(
            "iptables -D OUTPUT -p tcp --sport %s -m conntrack --ctstate ESTABLISHED -j ACCEPT",
            self.port))
    end

    if self.http_socket then
        self.http_socket:stop()
        self.http_socket = nil
    end
    if self.http_messagequeue then
        UIManager:removeZMQ(self.http_messagequeue)
        self.http_messagequeue = nil
    end
    logger.dbg("KoCloud: Server stopped.")
end

function KoCloud:showQRCode()
    if not self:isRunning() then
        self:start()
    end
    if not self:isRunning() then
        return
    end
    local ip = self:getIP()
    if not ip then
        local InfoMessage = require("ui/widget/infomessage")
        UIManager:show(InfoMessage:new{
            text = _("No network IP detected. Connect to Wi-Fi and try again."),
        })
        return
    end
    local qr_size = math.floor(math.min(Device.screen:getWidth(), Device.screen:getHeight()) * 0.50)
    UIManager:show(QRMessage:new{
        text = T("http://%1:%2", ip, self.port),
        width = qr_size,
        height = qr_size,
    })
end

function KoCloud:addToMainMenu(menu_items)
    menu_items.kocloud = {
        text = _("KoCloud"),
        sorting_hint = "tools",
        sub_item_table = {
            -- Server (dashboard) controls
            {
                text_func = function()
                    if self:isRunning() then
                        return _("Stop dashboard server")
                    else
                        return _("Start dashboard server")
                    end
                end,
                keep_menu_open = true,
                callback = function(touchmenu_instance)
                    if self:isRunning() then
                        self:stop()
                    else
                        self:start()
                    end
                    if touchmenu_instance then
                        touchmenu_instance:updateItems()
                    end
                end,
            },
            {
                text_func = function()
                    if self:isRunning() then
                        return _("Show QR code")
                    end
                    return _("Show QR code (starts server)")
                end,
                keep_menu_open = true,
                callback = function(touchmenu_instance)
                    self:showQRCode()
                    if touchmenu_instance then
                        touchmenu_instance:updateItems()
                    end
                end,
            },
            {
                text_func = function()
                    if self:isRunning() then
                        local ip = self:getIP()
                        if ip then
                            return T(_("Open http://%1:%2"), ip, self.port)
                        end
                        return T(_("Listening on port %1"), self.port)
                    else
                        return _("Not running")
                    end
                end,
                enabled_func = function() return false end,
                separator = true,
            },
            {
                text_func = function()
                    return T(_("Port: %1"), self.port)
                end,
                keep_menu_open = true,
                callback = function(touchmenu_instance)
                    local InputDialog = require("ui/widget/inputdialog")
                    local port_dialog
                    port_dialog = InputDialog:new{
                        title = _("Set custom port"),
                        input = self.port,
                        input_type = "number",
                        buttons = {{
                            {
                                text = _("Cancel"),
                                id = "close",
                                callback = function()
                                    UIManager:close(port_dialog)
                                end,
                            },
                            {
                                text = _("Save"),
                                is_enter_default = true,
                                callback = function()
                                    local new_port = port_dialog:getInputText()
                                    UIManager:close(port_dialog)
                                    if new_port and new_port ~= "" then
                                        self.port = new_port
                                        G_reader_settings:saveSetting("kodashboard_port", new_port)
                                    end
                                    if touchmenu_instance then
                                        touchmenu_instance:updateItems()
                                    end
                                end,
                            },
                        }},
                    }
                    UIManager:show(port_dialog)
                end,
            },
            -- Annotation sync channel
            {
                text = _("Annotation sync"),
                keep_menu_open = true,
                sub_item_table = {
                    self:cloudAccountItem("annotations"),
                    {
                        text = _("Sync current book"),
                        enabled_func = function()
                            return Sync.isConfigured() and not Sync.isBusy()
                                and (self.document and self.document.file ~= nil)
                        end,
                        keep_menu_open = true,
                        callback = function()
                            self:syncCurrentBook("annotations", true)
                        end,
                    },
                    {
                        text = _("Sync all books now"),
                        enabled_func = function()
                            return Sync.isConfigured() and not Sync.isBusy()
                        end,
                        keep_menu_open = true,
                        callback = function()
                            Sync.startJob("annotations", false)
                        end,
                    },
                    { separator = true },
                    self:autoToggleItem("annotations", "open", _("Auto-sync on book open")),
                    self:autoToggleItem("annotations", "close", _("Auto-sync on book close")),
                    self:autoToggleItem("annotations", "resume", _("Auto-sync on resume")),
                },
            },
            -- Reading progress sync channel
            {
                text = _("Progress sync"),
                keep_menu_open = true,
                sub_item_table = {
                    self:cloudAccountItem("progress"),
                    {
                        text = _("Conflict resolution: use later progress"),
                        checked_func = function()
                            return Sync.getProgressSettings().conflict ~= "earlier"
                        end,
                        keep_menu_open = true,
                        callback = function(touchmenu_instance)
                            local s = Sync.getProgressSettings()
                            s.conflict = "later"
                            Sync.saveProgressSettings(s)
                            if touchmenu_instance then touchmenu_instance:updateItems() end
                        end,
                    },
                    {
                        text = _("Conflict resolution: use earlier progress"),
                        checked_func = function()
                            return Sync.getProgressSettings().conflict == "earlier"
                        end,
                        keep_menu_open = true,
                        callback = function(touchmenu_instance)
                            local s = Sync.getProgressSettings()
                            s.conflict = "earlier"
                            Sync.saveProgressSettings(s)
                            if touchmenu_instance then touchmenu_instance:updateItems() end
                        end,
                    },
                    { separator = true },
                    {
                        text = _("Sync current book"),
                        enabled_func = function()
                            return Sync.isProgressConfigured() and not Sync.isBusy()
                                and (self.document and self.document.file ~= nil)
                        end,
                        keep_menu_open = true,
                        callback = function()
                            self:syncCurrentBook("progress", true)
                        end,
                    },
                    {
                        text = _("Sync all books now"),
                        enabled_func = function()
                            return Sync.isProgressConfigured() and not Sync.isBusy()
                        end,
                        keep_menu_open = true,
                        callback = function()
                            Sync.startJob("progress", false)
                        end,
                    },
                    { separator = true },
                    self:autoToggleItem("progress", "open", _("Auto-sync progress on book open")),
                    self:autoToggleItem("progress", "close", _("Auto-sync progress on book close")),
                    self:autoToggleItem("progress", "resume", _("Auto-sync progress on resume")),
                },
            },
            {
                text_func = function()
                    return "KoCloud v1.0"
                end,
                enabled_func = function() return false end,
            },
        },
    }
end

-- Shared menu item: current cloud account (tap to manage), per channel.
function KoCloud:cloudAccountItem(channel)
    return {
        text_func = function()
            if not Sync.available() then
                return _("Cloud sync unavailable")
            end
            local server
            if channel == "progress" then
                server = Sync.getProgressSettings().server
            else
                server = Sync.getSettings().sync_server
            end
            if server then
                local typ = server.type == "dropbox" and "Dropbox" or "WebDAV"
                return T(_("Cloud: %1 (%2)"), server.name or "?", typ)
            end
            return _("Configure cloud storage")
        end,
        enabled_func = function() return Sync.available() end,
        keep_menu_open = true,
        callback = function(touchmenu_instance)
            self:cloudConfigure(touchmenu_instance, channel)
        end,
    }
end

-- Menu item: auto-sync toggle for one channel + trigger point.
function KoCloud:autoToggleItem(channel, key, text)
    return {
        text = text,
        checked_func = function()
            if channel == "progress" then
                return Sync.getProgressSettings().auto[key] == true
            end
            return Sync.getSettings()["sync_on_" .. key] == true
        end,
        callback = function()
            if channel == "progress" then
                local s = Sync.getProgressSettings()
                s.auto[key] = not (s.auto[key] == true)
                Sync.saveProgressSettings(s)
            else
                local s = Sync.getSettings()
                s["sync_on_" .. key] = not (s["sync_on_" .. key] == true)
                Sync.saveSettings(s)
            end
        end,
    }
end

-- Cloud server configuration dialog (KOReader's cloud storage widget), per
-- channel. 'annotations' keeps the legacy highlight_sync table; 'progress'
-- uses the kocloud_progress table.
function KoCloud:cloudConfigure(touchmenu_instance, channel)
    if not Sync.available() then return end
    local SyncServiceW = require("frontend/apps/cloudstorage/syncservice")
    local settings
    local function read()
        if channel == "progress" then
            settings = Sync.getProgressSettings()
        else
            settings = Sync.getSettings()
        end
    end
    read()
    local function persist()
        if channel == "progress" then
            Sync.saveProgressSettings(settings)
        else
            Sync.saveSettings(settings)
        end
        if touchmenu_instance then touchmenu_instance:updateItems() end
    end
    local function open_editor()
        local editor = SyncServiceW:new{}
        editor.onClose = function(this) UIManager:close(this) end
        editor.onConfirm = function(sv)
            if channel == "progress" then
                settings.server = sv
            else
                settings.sync_server = sv
            end
            persist()
        end
        UIManager:show(editor)
    end
    local server = channel == "progress" and settings.server or settings.sync_server
    if not server then
        open_editor()
        return
    end
    local ConfirmBox = require("ui/widget/confirmbox")
    local ButtonDialog = require("ui/widget/buttondialog")
    local dialogue = ButtonDialog:new{
        title = T(_("Cloud storage:\n%1\n\nFolder path:\n%2"),
            server.name or "",
            SyncServiceW.getReadablePath and SyncServiceW.getReadablePath(server) or ""),
        buttons = {{
            {
                text = _("Delete"),
                callback = function()
                    UIManager:close(dialogue)
                    UIManager:show(ConfirmBox:new{
                        text = _("Delete server info?"),
                        ok_text = _("Delete"),
                        ok_callback = function()
                            settings.sync_server = nil
                            if channel == "progress" then settings.server = nil end
                            persist()
                        end,
                    })
                end,
            },
            {
                text = _("Edit"),
                callback = function()
                    UIManager:close(dialogue)
                    open_editor()
                end,
            },
            {
                text = _("Close"),
                callback = function() UIManager:close(dialogue) end,
            },
        }},
    }
    UIManager:show(dialogue)
end

-- Dispatch GotoXPointer once the reader document is attached (exact CRE
-- position; PDFs simply have no handler for it, so it no-ops there).
function KoCloud:jumpToXPointer(xp)
    local ui2 = self.ui
    if not ui2 or not ui2.handleEvent or type(xp) ~= "string" or xp == "" then return end
    local tries = 0
    local attempt
    attempt = function()
        if ui2.document and ui2.document.file then
            ui2:handleEvent(Event:new("GotoXPointer", xp))
            return
        end
        tries = tries + 1
        if tries < 10 then
            UIManager:scheduleIn(0.15, attempt)
        end
    end
    attempt()
end

-- Dispatch GotoPercent once the reader document is attached. Reloading the
-- document just to change progress is slow and racy (ReaderRolling has no
-- .document mid-reload), so retry briefly instead of scheduling blindly.
function KoCloud:jumpToPercent(pct)
    local ui2 = self.ui
    if not ui2 or not ui2.handleEvent then return end
    local tries = 0
    local attempt
    attempt = function()
        if ui2.document and ui2.document.file then
            ui2:handleEvent(Event:new("GotoPercent", pct))
            return
        end
        tries = tries + 1
        if tries < 10 then
            UIManager:scheduleIn(0.15, attempt)
        end
    end
    attempt()
end

-- Live sync of the book open in this reader instance, per channel.
function KoCloud:syncCurrentBook(channel, reload)
    local ui = self.ui
    if not ui or not self.document or not self.document.file then return end
    local sidecar_dir = nil
    local dset = ui.doc_settings
    if dset and type(dset.getSidecarDir) == "function" then
        local ok_dir, dir = pcall(dset.getSidecarDir, dset, self.document.file)
        if ok_dir then sidecar_dir = dir end
    end
    local is_reload = reload
    if channel == "progress" then
        if not Sync.isProgressConfigured() then return end
        local sync_ui = ui
        -- Fresh exact position from the live document (CRE xpointer).
        local live_xp = nil
        if sync_ui.document and type(sync_ui.document.getXPointer) == "function" then
            local ok_xp, xp = pcall(sync_ui.document.getXPointer, sync_ui.document)
            if ok_xp and type(xp) == "string" and xp ~= "" then live_xp = xp end
        end
        Sync.syncBookProgress(self.document.file, {
            silent = false,
            sidecar_dir = sidecar_dir,
            live_xp = live_xp,
            apply_progress = function(percent, payload)
                local ds = sync_ui.doc_settings
                if ds and ds.data then
                    ds.data.percent_finished = percent
                    if type(ds.data.summary) == "table" then
                        ds.data.summary.percent_finished = percent
                    end
                    if type(payload.xp) == "string" then
                        ds.data.last_xpointer = payload.xp
                    end
                end
                if is_reload then
                    -- Jump to the synced position: xpointer first (exact CRE
                    -- resume), percentage fallback (metadata 0-1, event 0-100).
                    -- No reload needed: we are already inside the document.
                    local target_pct = math.floor((tonumber(percent) or 0) * 100 + 0.5)
                    UIManager:nextTick(function()
                        if type(payload.xp) == "string" then
                            self:jumpToXPointer(payload.xp)
                        elseif target_pct > 0 then
                            self:jumpToPercent(target_pct)
                        end
                    end)
                end
                return true
            end,
        })
        return
    end
    if not ui.annotation then return end
    Sync.syncBook(self.document.file, ui.annotation.annotations, {
        silent = false,
        sidecar_dir = sidecar_dir,
        apply_live = function(merged)
            ui.annotation.annotations = merged
            if is_reload then
                kocloud_reloading = true
                UIManager:tickAfterNext(function() ui:reloadDocument() end)
            end
            return true
        end,
    })
end

-- Reader-context events: dispatch each configured channel per its own auto
-- toggles (annotations under highlight_sync, progress under kocloud_progress).
function KoCloud:onReaderReady()
    if kocloud_reloading then
        kocloud_reloading = false
        return
    end
    -- A progress value may have been applied by a background (closed-book)
    -- sync: offer to jump to it now that the book is open.
    local ready_dset = self.ui and self.ui.doc_settings
    if ready_dset and ready_dset.data and ready_dset.data.kocloud_pending_percent then
        local pending = tonumber(ready_dset.data.kocloud_pending_percent) or 0
        local pending_xp = ready_dset.data.kocloud_pending_xp
        ready_dset.data.kocloud_pending_percent = nil
        ready_dset.data.kocloud_pending_xp = nil
        if pending > 0 then
            local jump_pct = math.floor(pending * 100 + 0.5)
            local jump_xp = type(pending_xp) == "string" and pending_xp or nil
            UIManager:scheduleIn(0.5, function()
                local ConfirmBox = require("ui/widget/confirmbox")
                UIManager:show(ConfirmBox:new{
                    text = T(_("Synced reading progress is at %1%. Jump to it?"), jump_pct),
                    ok_text = _("Jump"),
                    ok_callback = function()
                        if jump_xp then
                            self:jumpToXPointer(jump_xp)
                        else
                            self:jumpToPercent(jump_pct)
                        end
                    end,
                })
            end)
        end
    end
    local s = Sync.getSettings()
    if s.sync_on_open and Sync.isConfigured() then
        UIManager:nextTick(function() self:syncCurrentBook("annotations", true) end)
    end
    local p = Sync.getProgressSettings()
    if p.auto.open and Sync.isProgressConfigured() then
        UIManager:nextTick(function() self:syncCurrentBook("progress", true) end)
    end
end

function KoCloud:onCloseDocument()
    if kocloud_reloading then return end
    local s = Sync.getSettings()
    if s.sync_on_close and Sync.isConfigured() then
        self:syncCurrentBook("annotations", false)
    end
    local p = Sync.getProgressSettings()
    if p.auto.close and Sync.isProgressConfigured() then
        self:syncCurrentBook("progress", false)
    end
end

function KoCloud:onResume()
    local s = Sync.getSettings()
    if s.sync_on_resume and Sync.isConfigured() and NetworkMgr:isWifiOn() then
        UIManager:nextTick(function() self:syncCurrentBook("annotations", true) end)
    end
    local p = Sync.getProgressSettings()
    if p.auto.resume and Sync.isProgressConfigured() and NetworkMgr:isWifiOn() then
        UIManager:nextTick(function() self:syncCurrentBook("progress", true) end)
    end
end
function KoCloud:getIP()
    local socket = require("socket")
    local s = socket.udp()
    s:setpeername("10.255.255.255", 1)
    local ip = s:getsockname()
    s:close()
    if ip and ip ~= "0.0.0.0" then
        return ip
    end
    return nil
end

function KoCloud:sendResponse(reqinfo, http_code, content_type, body)
    if not http_code then http_code = 400 end
    if not body then body = "" end
    if type(body) ~= "string" then body = tostring(body) end

    local response = {}
    table.insert(response, T("HTTP/1.0 %1 %2", http_code, HTTP_RESPONSE_CODE[http_code] or "Unspecified"))
    if content_type then
        local charset = ""
        if util.stringStartsWith(content_type, "text/") or content_type == CTYPE.JSON then
            charset = "; charset=utf-8"
        end
        table.insert(response, T("Content-Type: %1%2", content_type, charset))
    end
    if http_code == 302 then
        table.insert(response, T("Location: %1", body))
        body = ""
    end
    table.insert(response, "Access-Control-Allow-Origin: *")
    table.insert(response, "Cache-Control: no-store, no-cache, must-revalidate, max-age=0")
    table.insert(response, "Pragma: no-cache")
    table.insert(response, "Expires: 0")
    table.insert(response, T("Content-Length: %1", #body))
    table.insert(response, "Connection: close")
    table.insert(response, "")
    table.insert(response, body)
    response = table.concat(response, "\r\n")
    if self.http_socket then
        self.http_socket:send(response, reqinfo.request_id)
    end
    return Event:new("InputEvent")
end

function KoCloud:onRequest(data, request_id)
    local reqinfo = { request_id = request_id }
    local head, body = data:match("^(.-)\r?\n\r?\n(.*)$")
    head = head or data
    body = body or ""

    local method, uri = head:match("^(%u+)%s+([^%s]+)%s+HTTP/%d%.%d")
    if not method or not uri then
        return self:sendResponse(reqinfo, 400, CTYPE.TEXT, "Malformed request")
    end

    local headers = {}
    for line in head:gmatch("\r?\n([^\r\n]+)") do
        local k, v = line:match("^%s*([^:]+):%s*(.*)$")
        if k and v then
            headers[tostring(k):lower()] = v
        end
    end

    reqinfo.method = method
    reqinfo.headers = headers
    reqinfo.body = body

    if method == "POST" then
        local clen = tonumber(headers["content-length"] or "0") or 0
        if clen < 0 then clen = 0 end
        if #reqinfo.body < clen and request_id and request_id.receive then
            local remain = clen - #reqinfo.body
            local chunks = { reqinfo.body }
            while remain > 0 do
                local part, err, partial = request_id:receive(remain)
                if part and #part > 0 then
                    table.insert(chunks, part)
                    remain = remain - #part
                elseif partial and #partial > 0 then
                    table.insert(chunks, partial)
                    remain = remain - #partial
                else
                    logger.warn("KoCloud: failed reading POST body:", err or "unknown")
                    break
                end
            end
            reqinfo.body = table.concat(chunks)
        end
    end

    if method ~= "GET" and method ~= "POST" then
        return self:sendResponse(reqinfo, 405, CTYPE.TEXT, "Only GET/POST supported")
    end

    uri = util.urlDecode(uri)
    -- strip query string for routing
    local path = uri:match("^([^?]*)") or uri

    -- API routes
    if util.stringStartsWith(path, "/api/") then
        local ok_api, api = pcall(require, "api")
        if not ok_api or type(api) ~= "table" then
            logger.err("KoCloud: failed to load api module:", tostring(api))
            return self:sendResponse(reqinfo, 500, CTYPE.JSON, '{"error":"api module load failed"}')
        end

        if type(api.handleRequest) == "function" then
            return api.handleRequest(self, reqinfo, path, uri)
        end

        -- Backward compatibility for mixed plugin files where api.lua is older.
        if type(api.route) == "function" then
            logger.warn("KoCloud: api.handleRequest missing, falling back to api.route")
            local JSON = require("json")
            local ok_route, payload = xpcall(function()
                return api.route(path, uri, reqinfo)
            end, function(err)
                if debug and debug.traceback then
                    return debug.traceback(tostring(err), 2)
                end
                return tostring(err)
            end)
            if not ok_route then
                logger.err("KoCloud: legacy api.route error:", payload)
                local enc_ok, err_body = pcall(JSON.encode, {
                    error = "internal server error",
                    detail = tostring(payload),
                })
                if enc_ok then
                    return self:sendResponse(reqinfo, 500, CTYPE.JSON, err_body)
                end
                return self:sendResponse(reqinfo, 500, CTYPE.JSON,
                    '{"error":"internal server error","detail":"failed to encode error"}')
            end

            local enc_ok, json_str = pcall(JSON.encode, payload)
            if not enc_ok then
                logger.err("KoCloud: legacy api JSON encode error:", json_str)
                return self:sendResponse(reqinfo, 500, CTYPE.JSON, '{"error":"json encoding failed"}')
            end
            return self:sendResponse(reqinfo, 200, CTYPE.JSON, json_str)
        end

        logger.err("KoCloud: api module missing request handlers")
        return self:sendResponse(reqinfo, 500, CTYPE.JSON, '{"error":"api handler missing"}')
    end

    -- Static file serving from plugin's web/ directory
    if path == "/" then
        path = "/index.html"
    end
    local plugin_dir = self:getPluginDir()
    local filepath = plugin_dir .. "/web" .. path
    if method ~= "GET" then
        return self:sendResponse(reqinfo, 405, CTYPE.TEXT, "Method not allowed")
    end
    local f = io.open(filepath, "rb")
    if f then
        local content = f:read("*all")
        f:close()
        local ext = path:match("(%.[^.]+)$") or ""
        local ctype = EXT_TO_CTYPE[ext]
        return self:sendResponse(reqinfo, 200, ctype, content)
    end

    return self:sendResponse(reqinfo, 404, CTYPE.TEXT, "Not found: " .. path)
end

function KoCloud:getPluginDir()
    local info = debug.getinfo(1, "S")
    local plugin_path = info.source:match("@(.*/)")
    return plugin_path or "."
end

return KoCloud

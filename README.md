[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![KOReader](https://img.shields.io/badge/KOReader-%E2%89%A5%20v2026.07-blue.svg)](https://github.com/koreader/koreader)

# KoCloud - KOReader Reading Dashboard & Cloud Sync Plugin

> **KoCloud: a web reading dashboard (statistics, highlights, calendar) plus two-channel cloud sync for annotations & reading progress — backed by your own WebDAV/Dropbox.**

> **Author**: ArinChin | **License**: MIT | **Compatible**: KOReader ≥ v2026.07 (cloud storage support)

---

## 📖 Overview

KoCloud grew out of the **kodashboard** web dashboard and folds several reading-life features into one plugin:

| Feature | Description |
| :--- | :--- |
| 🌐 **Web Dashboard** | Browse books, reading statistics, a year of reading history, calendar heat & highlights from any browser on the same network |
| ☁️ **Annotation Sync** | Merge highlights / notes / bookmarks across devices through your own WebDAV or Dropbox (three-way, conflict-safe) |
| 📖 **Reading Progress Sync** | Keep your position in sync across devices; jump precisely via CRE `xpointer`, fall back to percentage |
| 🎨 **Fancy Highlight Styles** | Wavy / Squiggly / Dash / Dot / Double underline / Zig-zag / Circle / Rectangle highlight styles (built-in, no patch needed) |
| 🖼️ **Cover Backup** | One-file backup & restore of the generated cover cache |

> 💡 **Inspiration**:
- [kodashboard](https://github.com/) — the original local dashboard by YuchenLi (personal fork)
- [KoInsight](https://github.com/) — blue-white day theme & reading-history heatmap direction
- [koreader-Highlight-Sync](https://github.com/gitalexcampos/koreader-Highlight-Sync) — three-way annotation merge logic
- [2-fancy-highlight-styles.lua](https://github.com/) — community highlight style patch (folded in)

---

## 📄 License

This project is licensed under the **MIT License**.

The three-way annotation merge algorithm is ported from
[koreader-Highlight-Sync](https://github.com/gitalexcampos/koreader-Highlight-Sync)
and the fancy highlight drawer code derives from the community
`2-fancy-highlight-styles.lua` patch — see the file headers for details.
Cover themes / web layout take visual direction from
[KoInsight](https://github.com/). All upstreams keep their own licenses.

---

## 🚀 Core Features

### 1. 🌐 Web Dashboard

A self-contained web app served by the device (default port `8686`). Open the
QR code from `Tools → KoCloud → Show QR code`, or browse to
`http://<device-ip>:8686` on any phone/PC on the same network.

| View | Content |
| :--- | :--- |
| **Books** | Library grid/table, progress, highlights count, cover fetch |
| **Stats** | Reading trend, per-weekday/hourly rhythm, top books, year-long reading-history heatmap |
| **Calendar** | Day-by-day reading heat + per-day book breakdown |
| **Highlights** | All annotations grouped by book, search / filter / export |
| **Cloud** | Annotation & progress sync status, conflict preference, cover backup/restore |

| Web Feature | Description |
| :--- | :--- |
| **Theme** | One-tap dark (pink-black) / light (KoInsight blue-white) toggle, remembered per browser |
| **Screenshot** | Export the current view as a PNG |
| **Language** | Follows the browser language (Chinese UI when `zh`) |

### 2. ☁️ Annotation Sync

Synchronizes each book's annotations (highlights / notes / bookmarks) with a
folder of your own cloud (WebDAV or Dropbox) — no third-party server involved.

**How the merge works** (three-way diff via the `*.sync` cached copy):

| Case | Result |
| :--- | :--- |
| New on one side only | Adopted (added) |
| In the last-sync set but gone on one side | Deleted there — deletion propagates (not resurrected) |
| Changed on both sides since last sync | Newer `datetime_updated` wins |
| Same on both sides | No-op |

Menu: `Tools → KoCloud → Annotation sync`

| Setting | Description |
| :--- | :--- |
| **Cloud account…** | Pick/create a WebDAV or Dropbox server + cloud folder (independent of the progress channel) |
| **Sync current book / all books** | Manual sync |
| **Auto-sync on open / close / resume** | Independent per-channel triggers |

> ⚠️ Deletion is authoritative: deleting a highlight on one device removes it
> on others after sync. A `.bak` of each book's metadata is kept before every
> write-back.

### 3. 📖 Reading Progress Sync

Syncs reading progress per book through its own cloud account/folder.

| Setting | Description |
| :--- | :--- |
| **Conflict resolution** | `Use later progress` (default, bigger %) or `Use earlier progress` |
| **Sync current book / all books** | Manual sync |
| **Auto-sync on open / close / resume** | Independent per-channel triggers |

Conflict rule: single-side changes flow automatically; only when **both**
sides moved since the last sync does the preference decide. EPUBs jump with
the exact CRE `last_xpointer` (same precision as KOReader resume); PDFs fall
back to percentage.

### 4. 🎨 Fancy Highlight Styles

Mounted at startup (no `patches/` file needed): the style picker gains
**Wavy, Squiggly, Dash, Dot, Double underline, Zig-zag, Circle, Rectangle**
next to the stock styles, with adjustable thickness remembered per style.
Keeping the old standalone patch file alongside is harmless (built-in
duplicate guards).

### 5. 🖼️ Cover Backup / Restore

Packs the generated cover cache into a single self-describing container and
pushes it through the annotation channel's cloud account:

| Action | Description |
| :--- | :--- |
| **Backup covers** | Upload current cover cache (container `kodashboard-covers.bin`) |
| **Restore covers** | Pull the remote container and unpack it over the local cache |

---

## 📥 Installation

1. Download / clone this repository.
2. Copy the whole `KoCloud.koplugin` folder into KOReader's `plugins/`
   directory (Kindle: `koreader/plugins/`, other devices per your install).
3. Restart KOReader.
4. (Optional) delete the old `kodashboard.koplugin` folder if still present.

> Requires KOReader with cloud storage support (the stock `cloudstorage`
> module) for the sync features. Requires a network to view the dashboard.

---

## ⚙️ Quick Start

1. **Dashboard**: `Tools → KoCloud → Start dashboard server` → tap
   **Show QR code** → scan from your phone.
2. **Cloud setup**: `Tools → KoCloud → Annotation sync → Cloud account…`
   (reuses a previous HighlightSync config automatically) — repeat under
   **Progress sync** for the progress channel; pick folders per channel.
3. Choose **conflict preference** under `Progress sync` if you ever read the
   same book on two devices at different spots.
4. Turn on the per-channel **auto-sync** toggles you want.

---

## 🔌 Compatibility & Dependencies

| Item | Requirement |
| :--- | :--- |
| **KOReader** | ≥ v2026.07 (cloud storage `syncservice`) |
| **Cloud** | WebDAV or Dropbox account |
| **Network** | Dashboard/QR usage needs the device on your LAN |

---

## 🌐 Internationalization

| Surface | Mechanism |
| :--- | :--- |
| KOReader menu | gettext `.po` (`l10n/zh_CN/`) — add your language next to it |
| Web UI | auto — follows the browser language (`zh` → Chinese) |

---

## 🧑‍💻 Developer Info

- **Author**: ArinChin (maintainer; originally forked from YuchenLi's kodashboard)
- **Repository**: [github.com/Arin-Chin/KoCloud.koplugin](https://github.com/Arin-Chin/KoCloud.koplugin)
- **License**: MIT
- **Version**: 1.1.0

## 🗂️ Sync identity (read first)

A book is identified on the cloud by its **sidecar directory basename** (the
book file name, e.g. `Name.epub.sdr`). For sync to work across devices:

- The **book file name must be identical on every device**. Different library
  roots are fine — only the basename is used (an earlier build hashed the full
  path, which split devices with different roots into separate cloud files).
- All devices must use the **same cloud folder** for the channel.
- Devices should use the same KOReader metadata-location setting (sidecar /
  hash-based) so the same book resolves to the same basename.

Other notes:

- First sync of a book logs a harmless `WebDavApi: Download failure: 404` —
  that just means "not on the cloud yet"; the file is then uploaded.
- Two different books that happen to share one file name (in different folders)
  would collide on the cloud — rename one of them.
- Orphan files named `*-xxxxxxxx.json` in the cloud folder (left by an
  experimental build) can be deleted; current builds use plain `*.json` /
  `*.progress.json`.

---
---

## 🧪 Manual Test Checklist — v1.1.0 (post-audit fixes)

Run after deploying a build that includes the audit fixes. KOReader ≥ v2026.07,
two devices recommended for sync tests. Logs: `crash.log` on the device
(`grep -n "KoCloud" crash.log` to follow this plugin's lines).

### A. Security & HTTP server
1. Start the dashboard server, then from a PC on the same LAN request
   `GET /../settings.reader.lua`, `GET /%2e%2e/settings.reader.lua`,
   `GET /web/%2e%2e/%2e%2e/etc/passwd` — every one must return **400 Bad path**,
   never file content.
2. `GET /style.css`, `GET /app.js?v=…`, `GET /` still serve normally.
3. POST a body with `Content-Length: 99999999` but send nothing — server must not
   hang the UI (request dropped after the cap/30s budget); normal cover uploads
   (≤2 MiB) still work; upload of a non-image with `image/jpeg` header is rejected
   with **415**.
4. Web console check: cloud sync / covers endpoints only accept POST — a plain
   `GET /api/cloud/covers/backup` returns **405** and starts nothing.

### B. Sync core (annotations)
5. Cold start (fresh process): without opening any menu, POST
   `api/cloud/covers/backup` from the web page — must succeed (regression for the
   covers-block-in-`isConfigured` bug) and not error-call-nil.
6. Annotate a book on device A → sync (menu "Sync current book" or gesture). Device B
   syncs the same book: highlights/notes/bookmarks appear merged. Verify a
   `metadata.<ext>.lua.bak` sits next to the synced metadata and no `.old` pile-up.
7. Delete a highlight on A → sync → B must also lose it (deletion propagation).
8. Edit the same highlight on both devices while offline → sync → the newer
   `datetime_updated` wins.
9. While offline, run "Sync all books" → job finishes and busy flag clears
   (menu/web both usable afterwards; no "already running" stuck).
10. Kill network mid-sync → job records failures and stops; UI not frozen for >1s.
11. Suspend the device during a batch sync → job cancels (no continued per-book
    network activity after resume).

### C. Reload-loop & lifecycle
12. Enable auto-sync on book open for BOTH channels → open a book → exactly one sync
    + at most one document reload. Watch `crash.log`: no repeated
    `opening file …epub` loop (previous bug: one cycle every ~4 s).
13. Close the book right after an auto-sync → no crash, no stuck state; open it again
    normally.
14. Enable auto-sync on resume → sleep/wake the device with wifi on → one sync fires;
    without wifi nothing happens.

### D. Progress sync
15. Two devices read the same EPUB to different spots → sync → target device jumps to
    the **exact** paragraph of the other side (xpointer), not just a close page.
    With PDFs it falls back to percentage (page-level precision).
16. Conflict preference: set "use later progress" → both devices read apart → the
    bigger percent wins everywhere; switch to "use earlier" → smaller wins.
17. Closed-book batch sync (FM, no reader open) → next open shows
    "Synced reading progress is at N%. Jump to it?"; answering Yes jumps, No skips;
    restarting and reopening does **not** prompt again.
18. First-sync case: both devices already have progress and never synced before —
    with "later" the larger percent wins (previously the first-syncer's value won).

### E. Dispatcher / actions
19. Tools → (gesture manager) new gesture → action list shows
    **KoCloud: Sync annotations now** and **KoCloud: Sync reading progress now**.
20. Trigger the annotation gesture without a cloud server configured → short
    "not configured" toast, no silent no-op.

### F. Web dashboard
21. Cloud page: status cards show both channels; leave the Cloud view while a sync
    runs → browser network log shows the 1.2 s poll **stops** after leaving (and when
    the job ends).
22. Double-click "Backup covers" quickly → only one job starts.
23. Books page with a title containing `<`, `&`, full-width `｜`, curly quotes —
    renders unescaped correctly, cover fetch/dedupe for that book still matches.
24. Disable storage (private/blocked) → page still loads (no white screen).
25. Screenshot button: exports the current view as PNG; offline it errors with a
    toast instead of hanging.
26. Light theme heat cells visible; on an older WebView without `color-mix` the heat
    map/calendar still show tinted cells (fallback block).
27. Rapid double navigation books↔stats on a slow device → content always matches the
    highlighted nav item (no stale view overwrite).

### G. i18n & brand
28. KOReader UI in Chinese: all KoCloud menu items show Chinese (incl. the two
    prefixed dispatcher actions). Browser `zh` → web UI Chinese; browser `en` → English.

### H. Cleanup checks
29. No `*.baiduyun.uploading.cfg` or stray temp files inside the plugin folder.
30. `git status` in both local repos clean except your intended commit.

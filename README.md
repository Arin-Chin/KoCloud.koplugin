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
- **Version**: 1.0

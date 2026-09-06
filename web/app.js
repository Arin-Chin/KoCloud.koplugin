'use strict';

/* ============================================================
   i18n (Simplified Chinese)
   ============================================================ */
/* Lightweight i18n: when the browser language is Chinese, static labels are
   translated by walking text nodes / attributes and looking up I18N by the
   exact (trimmed) English text, and dynamic strings are composed through
   t('...%1...', ...) at their call sites (same %N convention as KOReader's
   Lua template). Everything runs after each render via a MutationObserver.
   Non-Chinese browsers: ZH is false, t() is a passthrough, and the DOM walk
   never runs — zero behavior change. */
function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
function lsSet(k, v) { try { lsSet(k, v); } catch (_) {} }

const ZH = /^zh/i.test(navigator.language || '');
const UI_LOCALE = ZH ? 'zh-CN' : 'en-US';

const I18N = {
  // navigation & chrome
  'Books': '书籍',
  'Calendar': '日历',
  'Reading stats': '阅读统计',
  'Stats': '统计',
  'Highlights': '摘录',
  'Cloud': '云同步',
  'Cloud sync': '云端同步',
  'Progress sync': '阅读进度同步',
  'progress': '进度同步',
  'Use later progress': '冲突时采用：靠后进度',
  'Use earlier progress': '冲突时采用：靠前进度',
  'Sync reading progress now': '立即同步全部阅读进度',
  'On conflict': '冲突时',
  'Configure in KOReader menu: Tools → KoCloud → Progress sync.': '请在 KOReader 菜单中配置：工具 → KoCloud → 阅读进度同步。',
  'Cloud storage': '云存储',
  'Not configured': '未配置',
  'Configure in KOReader menu: Tools → KoCloud → Cloud sync.': '请在 KOReader 菜单中配置：工具 → KoCloud → 云端同步。',
  'Cloud folder: %1': '云端文件夹：%1',
  'Sync all annotations now': '立即同步全部标注',
  'Sync started': '已开始同步',
  'Sync current book': '同步当前书籍',
  'Sync all books': '同步所有书籍',
  'Covers': '封面',
  'No recent book to sync': '没有可同步的最近书籍',
  'Cloud sync unavailable': '云端同步不可用',
  'No sync job yet': '暂无同步记录',
  'Running': '同步中',
  'Finished': '已完成',
  'Auto-sync': '自动同步',
  'on book open': '开书时',
  'on book close': '关书时',
  'on resume': '唤醒时',
  'Errors': '错误',
  'Your annotations, in the cloud.': '你的标注，云端同步。',
  'Push and pull highlights and notes with your WebDAV or Dropbox.': '通过 WebDAV 或 Dropbox 推送与拉取你的摘录与笔记。',
  'Current book': '当前书籍',
  'Configured': '已配置',
  'ok': '成功',
  'skipped': '跳过',
  'failed': '失败',
  'Activity': '同步动态',
  'Last sync': '上次同步',
  'Cloud sync failed: %1': '云端同步失败：%1',
  'Exported JSON': '已导出 JSON',
  'Copied': '已复制',
  'Copy failed': '复制失败',
  'Backup covers': '备份封面',
  'Restore covers': '恢复封面',
  'covers-backup': '封面备份',
  'covers-restore': '封面恢复',
  'annotations': '标注同步',
  'Disconnect': '断开连接',
  'Disconnect and stop KoCloud server': '断开连接并停止 KoCloud 服务器',
  'Primary': '主导航',
  'Switch to light theme': '切换到日间主题',
  'Switch to dark theme': '切换到夜间主题',
  'Export page as PNG': '导出当前页面为 PNG',
  'Capturing…': '正在截图…',
  'PNG saved': 'PNG 已保存',
  'Screenshot failed: %1': '截图失败：%1',
  // books page
  'Library': '书库',
  'In Progress': '在读',
  'Reading Time': '阅读时长',
  'Annotations': '标注',
  'books tracked': '已跟踪书籍',
  'reading / finished': '在读 / 已读完',
  'all time': '累计',
  '%1 highlights · %2 notes': '%1 条摘录 · %2 条笔记',
  'KoReader dashboard': 'KoReader 仪表盘',
  'Your reading dashboard, redesigned.': '你的阅读仪表盘，焕然一新。',
  'Books, highlights, progress, and calendar activity in one place.': '书籍、摘录、进度与日历活动，一屏尽览。',
  'Search title or author': '搜索书名或作者',
  'All': '全部',
  'Reading': '在读',
  'With highlights': '有摘录',
  'Sort': '排序',
  'Last open': '最近打开',
  'Progress': '进度',
  'Title': '标题',
  'Read time': '阅读时长',
  'Asc': '升序',
  'Desc': '降序',
  'books': '本书',
  'Grid view': '网格视图',
  'Table view': '表格视图',
  'Pulling covers…': '正在获取封面…',
  'Pull Covers': '获取封面',
  'No books match your filters.': '没有符合筛选条件的书籍。',
  'Pages': '页数',
  'Book': '书籍',
  'Status': '状态',
  'Book filters': '书籍筛选',
  'View mode': '视图模式',
  'reading': '在读',
  'finished': '已读完',
  'queued': '未读',
  'Untitled': '无标题',
  'Unknown author': '未知作者',
  'Unknown': '未知',
  // stats page
  'Reading analytics': '阅读分析',
  'Patterns, pace, and momentum.': '阅读规律、节奏与势头。',
  'A cleaner view of how and when you read, with trend, rhythm, and top books all in one place.': '更清晰地呈现你的阅读方式与时段，趋势、节奏与书籍排行尽在一处。',
  'Best streak': '最长连续',
  'Current streak': '当前连续',
  'Range total': '区间总计',
  'Books touched': '阅读书籍数',
  'in %1 days': '近 %1 天',
  '%1-day reading time': '%1 天阅读时长',
  'Trend': '趋势',
  'Reading trend (%1 days)': '阅读趋势（近 %1 天）',
  'Trend range': '趋势范围',
  'Active days: %1 · Longest day: %2': '活跃天数：%1 · 最长单日：%2',
  'Reader insight': '读者洞察',
  'Based on selected %1-day window': '基于所选 %1 天窗口',
  'Monthly': '每月',
  'Monthly reading time': '每月阅读时长',
  '%1: %2 · %3 days': '%1：%2 · %3 天',
  'Rhythm': '节奏',
  'Average by weekday': '各星期日均阅读',
  '%1: %2 average': '%1：平均 %2',
  'When': '时段',
  'Hourly activity': '时段活动',
  'Sessions and reading time by local hour': '按本地时段统计的阅读次数与时长',
  'Top books': '书籍排行',
  'By reading time': '按阅读时长',
  'By pages read': '按阅读页数',
  'Momentum is building': '阅读势头正盛',
  'A slower reading week': '本周阅读放缓',
  'Your reading pace is steady': '阅读节奏平稳',
  'You logged %1 in the selected %2-day range.': '在所选 %2 天范围内，你累计阅读了 %1。',
  '%1 is your strongest reading day.': '%1是你阅读最多的日子。',
  'No weekday pattern yet.': '暂无星期规律。',
  'Most reading happens around %1:00.': '阅读最常发生在 %1:00 左右。',
  'Read a few sessions to unlock hourly patterns.': '多读几天即可解锁时段规律。',
  'Current streak: %1 days.': '当前连续阅读：%1 天。',
  'No current streak yet.': '暂无连续阅读记录。',
  '7d: %1': '7天：%1',
  '30d avg: %1': '30天日均：%1',
  'Best streak: %1d': '最长连续：%1 天',
  'No reading statistics available yet.': '暂无阅读统计数据。',
  '%1: %2 · %3 books': '%1：%2 · %3 本',
  'Total': '总计',
  'Active days': '活跃天数',
  'Best day': '最佳单日',
  'No data yet.': '暂无数据。',
  '%1: %2': '%1：%2',
  'No hourly activity yet.': '暂无时段活动数据。',
  '%1:00 · %2 · %3 sessions': '%1:00 · %2 · %3 次',
  'No ranked books yet.': '暂无排行数据。',
  '%1 pages': '%1 页',
  // calendar page
  'Reading streak': '阅读连续',
  'days best': '天最佳',
  'Current streak %1 days · Last read %2': '当前连续 %1 天 · 上次阅读 %2',
  'Month read days': '本月阅读天数',
  'Month time': '本月时长',
  'Today': '今天',
  'Mon': '周一',
  'Tue': '周二',
  'Wed': '周三',
  'Thu': '周四',
  'Fri': '周五',
  'Sat': '周六',
  'Sun': '周日',
  'Day details': '当日详情',
  'Select a day': '选择一天',
  'Tap a day with reading to inspect top books and duration.': '点击有阅读记录的日子查看书籍与时长详情。',
  'Total reading': '总阅读',
  'No book breakdown available.': '暂无当日书籍明细。',
  'Reading Rhythm': '阅读节奏',
  'Reading history': '阅读历史',
  'Daily heatmap': '每日热力图',
  'Last 12 months · %1 active days · %2': '近 12 个月 · %1 个活跃日 · %2',
  'Last 6 months · %1 active days · %2': '近 6 个月 · %1 个活跃日 · %2',
  'Last 12 weeks · %1 active days · %2': '近 12 周 · %1 个活跃日 · %2',
  'No reading stats': '无阅读统计',
  'No reading': '无阅读',
  '%1 sessions': '%1 次',
  '%1 pages touched': '%1 页',
  '%1 annotations': '%1 条',
  '%1 · %2': '%1 · %2',
  // book detail page
  'Book not found': '未找到书籍',
  'Back to library': '返回书库',
  '%1% complete': '已读 %1%',
  'Pages read': '已读页数',
  'Notes': '笔记',
  'Timeline': '时间线',
  'Reading milestones': '阅读里程碑',
  'items': '条',
  '%1 items': '%1 条',
  'Search annotations': '搜索标注',
  'No annotations for this book.': '本书暂无标注。',
  'No timeline data for this book yet.': '本书暂无时间线数据。',
  'First open': '首次打开',
  'First annotation': '首条标注',
  'Unknown time': '未知时间',
  '%1 reading sessions': '%1 次阅读',
  'page ?': '未知页码',
  'Note': '笔记',
  'Copy annotation': '复制标注',
  'note': '笔记',
  'highlight': '摘录',
  'bookmark': '书签',
  // highlights page
  'All highlights': '全部摘录',
  '%1 items across %2 books': '%1 条摘录，来自 %2 本书',
  'Search highlights': '搜索摘录',
  'Recent': '最近',
  'Count': '数量',
  'Expand all': '全部展开',
  'Collapse all': '全部收起',
  'Export JSON': '导出 JSON',
  'No matching highlights in this book.': '本书中没有匹配的摘录。',
  'No highlights found.': '没有找到摘录。',
  // cover pull
  'Cover pull paused': '封面获取已暂停',
  'Cover pull complete': '封面获取完成',
  'This may take a while depending on your library size and network speed.': '这可能需要一些时间，取决于书库大小和网络速度。',
  'Current:': '当前：',
  'Resume': '继续',
  'Pause': '暂停',
  'Close': '关闭',
  '%1 saved': '已获取 %1',
  '%1 skipped': '已跳过 %1',
  '%1 failed': '失败 %1',
  // disconnect flow
  'Disconnect current client and stop KoCloud server now?': '断开当前客户端并停止 KoCloud 服务器？',
  'Disconnecting...': '正在断开…',
  'Disconnected': '已断开',
  'Connection closed': '连接已关闭',
  'KoCloud server has been stopped. Restart it from KOReader menu when needed.': 'KoCloud 服务器已停止。需要时请从 KOReader 菜单重新启动。',
  'Disconnect failed: %1': '断开失败：%1',
  'Failed to load dashboard': '仪表盘加载失败',
  // relative dates & durations
  'just now': '刚刚',
  '%1m ago': '%1 分钟前',
  '%1h ago': '%1 小时前',
  '%1d ago': '%1 天前',
  '%1w ago': '%1 周前',
  '%1mo ago': '%1 个月前',
  'No reading yet': '尚未开始阅读',
  'Less than a minute': '不足一分钟',
  '%1 minutes': '%1 分钟',
  '%1 hours': '%1 小时',
  '%1 hours %2 minutes': '%1 小时 %2 分钟',
};

/* t('...', a, b): translate with %1/%2 placeholders (KOReader convention). */
function t(s, ...args) {
  if (!ZH) return s;
  const v = I18N[s] !== undefined ? I18N[s] : s;
  return v.replace(/%\d+/g, (m) => {
    const n = Number(m.slice(1));
    return args[n - 1] !== undefined ? String(args[n - 1]) : m;
  });
}

/* Translate static text nodes by exact (trimmed) dictionary match.
   Preserves surrounding whitespace; skips nodes that already contain CJK. */
function localizeTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tag = node.parentElement && node.parentElement.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  for (const node of nodes) {
    const data = node.data;
    if (!data) continue;
    const trimmed = data.trim();
    if (!trimmed || /[\u4e00-\u9fff]/.test(trimmed)) continue;
    const zh = I18N[trimmed];
    if (zh === undefined) continue;
    const lead = data.slice(0, data.length - data.trimStart().length);
    const trail = data.slice(data.trimEnd().length);
    node.data = lead + zh + trail;
  }
}

/* Translate static attribute values (titles, placeholders, tooltips). */
function localizeAttrs(root) {
  root.querySelectorAll('[title],[aria-label],[placeholder],[data-tip]').forEach((el) => {
    for (const attr of ['title', 'aria-label', 'placeholder', 'data-tip']) {
      const v = el.getAttribute(attr);
      if (!v || /[\u4e00-\u9fff]/.test(v)) continue;
      const zh = I18N[v.trim()];
      if (zh !== undefined) el.setAttribute(attr, zh);
    }
  });
}

let i18nTimer = null;
function installI18n() {
  if (!ZH) return;
  document.documentElement.lang = 'zh-CN';
  const run = () => {
    localizeTextNodes(document.body);
    localizeAttrs(document.body);
  };
  run();
  new MutationObserver(() => {
    if (i18nTimer) return;
    i18nTimer = setTimeout(() => { i18nTimer = null; run(); }, 80);
  }).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
}

/* ============================================================
   State
   ============================================================ */
const state = {
  view: 'books',
  bookId: null,
  booksMode: lsGet('kd-mode') || 'grid',
  booksSortKey: lsGet('kd-sort-key') || 'last_open_ts',
  booksSortDir: lsGet('kd-sort-dir') || 'desc',
  booksSearch: '',
  booksFilter: lsGet('kd-filter') || 'all',
  highlightsSearch: '',
  highlightsType: lsGet('kd-hl-type') || 'all',
  highlightsSort: lsGet('kd-hl-sort') || 'recent',
  statsTrendDays: Number(lsGet('kd-stats-trend-days') || '90') || 90,
  highlightsCollapsed: {},
  coverVersion: 0,
  coverPullJob: null,
  coverPullDismissed: false,
  calendarDate: new Date(),
  calendarSelectedDate: null,
};
const uiTimers = { booksSearch: null, highlightsSearch: null, annSearch: null };
let renderToken = 0;

function savePrefs() {
  lsSet('kd-mode', state.booksMode);
  lsSet('kd-sort-key', state.booksSortKey);
  lsSet('kd-sort-dir', state.booksSortDir);
  lsSet('kd-filter', state.booksFilter);
  lsSet('kd-hl-type', state.highlightsType);
  lsSet('kd-hl-sort', state.highlightsSort);
  lsSet('kd-stats-trend-days', String(state.statsTrendDays || 90));
}

/* ============================================================
   API
   ============================================================ */
const cache = {};
function invalidateApiCache(...paths) {
  paths.forEach((p) => { delete cache[p]; });
}
async function api(path) {
  if (cache[path]) return cache[path];
  const r = await fetch('/api/' + path);
  if (!r.ok) throw new Error(`API /${path} returned ${r.status}`);
  const data = await r.json();
  cache[path] = data;
  return data;
}

async function apiNoCache(path) {
  const r = await fetch('/api/' + path);
  let payload = null;
  try {
    payload = await r.json();
  } catch {
    try {
      payload = await r.text();
    } catch {
      payload = null;
    }
  }
  if (!r.ok) {
    const msg = typeof payload === 'string'
      ? payload
      : (payload?.detail || payload?.error || JSON.stringify(payload || {}));
    throw new Error(`API /${path} returned ${r.status}: ${msg}`);
  }
  return payload;
}

async function apiNoCachePost(path, body = null, contentType = 'application/json') {
  const opts = { method: 'POST', headers: {} };
  if (body != null) {
    opts.headers['Content-Type'] = contentType;
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const r = await fetch('/api/' + path, opts);
  let payload = null;
  try {
    payload = await r.json();
  } catch {
    try {
      payload = await r.text();
    } catch {
      payload = null;
    }
  }
  if (!r.ok) {
    const msg = typeof payload === 'string'
      ? payload
      : (payload?.detail || payload?.error || JSON.stringify(payload || {}));
    throw new Error(`API /${path} returned ${r.status}: ${msg}`);
  }
  return payload;
}

async function apiNoCacheBinary(path, body, contentType = 'application/octet-stream') {
  const r = await fetch('/api/' + path, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
  let payload = null;
  try {
    payload = await r.json();
  } catch {
    try {
      payload = await r.text();
    } catch {
      payload = null;
    }
  }
  if (!r.ok) {
    const msg = typeof payload === 'string'
      ? payload
      : (payload?.detail || payload?.error || JSON.stringify(payload || {}));
    throw new Error(`API /${path} returned ${r.status}: ${msg}`);
  }
  return payload;
}

let jsquashWebpEncodePromise = null;
let jsquashWebpDisabled = false;

async function getJsquashWebpEncode() {
  if (jsquashWebpDisabled) return null;
  if (!jsquashWebpEncodePromise) {
    jsquashWebpEncodePromise = import('https://esm.sh/@jsquash/webp@1.5.0')
      .then((m) => (typeof m?.encode === 'function' ? m.encode : null))
      .catch(() => null);
  }
  const encode = await jsquashWebpEncodePromise;
  if (!encode) jsquashWebpDisabled = true;
  return encode;
}

/* ============================================================
   Utilities
   ============================================================ */
const escDiv = document.createElement('div');
function esc(s) {
  if (s == null) return '';
  escDiv.textContent = String(s);
  return escDiv.innerHTML;
}

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v);
  return [];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function blobToImageSource(blob) {
  if (window.createImageBitmap) {
    try {
      const bmp = await createImageBitmap(blob);
      return { image: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close?.() };
    } catch (_) {}
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image decode failed'));
      el.src = url;
    });
    return { image: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, release: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(`canvas encode failed (${type})`));
    }, type, quality);
  });
}

async function compressCoverBlob(blob, { maxEdge = 640, quality = 0.72 } = {}) {
  const src = await blobToImageSource(blob);
  try {
    const srcW = Math.max(1, Number(src.width) || 1);
    const srcH = Math.max(1, Number(src.height) || 1);
    const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
    const dstW = Math.max(1, Math.round(srcW * scale));
    const dstH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    if (!ctx) throw new Error('canvas context unavailable');
    ctx.drawImage(src.image, 0, 0, dstW, dstH);

    // Prefer libwebp (WASM) encoding for browsers with flaky native canvas webp support.
    const encodeWebp = await getJsquashWebpEncode();
    if (encodeWebp) {
      try {
        const imageData = ctx.getImageData(0, 0, dstW, dstH);
        const webpBuf = await encodeWebp(imageData, { quality: Math.max(1, Math.min(100, Math.round(quality * 100))) });
        if (webpBuf && webpBuf.byteLength > 0) {
          return { blob: new Blob([webpBuf], { type: 'image/webp' }), contentType: 'image/webp' };
        }
      } catch (_) {}
    }

    const webpBlob = await canvasToBlob(canvas, 'image/webp', quality).catch(() => null);
    if (webpBlob && webpBlob.size > 0 && String(webpBlob.type || '').toLowerCase() === 'image/webp') {
      return { blob: webpBlob, contentType: 'image/webp' };
    }
    const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (jpgBlob && jpgBlob.size > 0 && String(jpgBlob.type || '').toLowerCase() === 'image/jpeg') {
      return { blob: jpgBlob, contentType: 'image/jpeg' };
    }
    const pngBlob = await canvasToBlob(canvas, 'image/png', quality).catch(() => null);
    if (pngBlob && pngBlob.size > 0) {
      return { blob: pngBlob, contentType: 'image/png' };
    }
    throw new Error('cover encode failed');
  } finally {
    src.release?.();
  }
}

async function compressAndUploadBookCover(bookRef) {
  const coverUrl = `${bookCoverUrl(bookRef)}&ts=${Date.now()}`;
  const r = await fetch(coverUrl, { cache: 'no-store' });
  if (!r.ok) throw new Error(`cover fetch failed (${r.status})`);
  const rawBlob = await r.blob();
  if (!rawBlob || !rawBlob.size) throw new Error('empty cover body');
  const compressed = await compressCoverBlob(rawBlob, { maxEdge: 640, quality: 0.72 });
  return apiNoCacheBinary(`books/${encBookRef(bookRef)}/upload-cover`, compressed.blob, compressed.contentType);
}

function debounceRun(timerKey, fn, delay = 180) {
  if (uiTimers[timerKey]) clearTimeout(uiTimers[timerKey]);
  uiTimers[timerKey] = setTimeout(() => {
    uiTimers[timerKey] = null;
    fn();
  }, delay);
}

async function copyTextToClipboard(text) {
  const value = String(text || '');
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (_) {}

  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch (_) {
    return false;
  }
}

function flashButtonText(btn, nextText, ms = 1200) {
  if (!btn) return;
  const old = btn.dataset.flashOriginal || btn.textContent;
  btn.dataset.flashOriginal = old;
  btn.textContent = nextText;
  if (btn._flashTimer) clearTimeout(btn._flashTimer);
  btn._flashTimer = setTimeout(() => {
    btn.textContent = btn.dataset.flashOriginal || old;
    btn._flashTimer = null;
  }, ms);
}

function flashButtonTitle(btn, nextTitle, ms = 1200) {
  if (!btn) return;
  const oldTitle = btn.dataset.flashTitle || btn.getAttribute('title') || '';
  btn.dataset.flashTitle = oldTitle;
  btn.setAttribute('title', nextTitle);
  btn.setAttribute('aria-label', nextTitle);
  if (btn._flashTitleTimer) clearTimeout(btn._flashTitleTimer);
  btn._flashTitleTimer = setTimeout(() => {
    btn.setAttribute('title', btn.dataset.flashTitle || oldTitle);
    btn.setAttribute('aria-label', btn.dataset.flashTitle || oldTitle);
    btn._flashTitleTimer = null;
  }, ms);
}

function flashButtonIcon(btn, iconName, ms = 1000, className = '') {
  if (!btn) return;
  const oldHtml = btn.dataset.flashIconHtml || btn.innerHTML;
  btn.dataset.flashIconHtml = oldHtml;
  btn.innerHTML = icon(iconName, 15);
  if (className) btn.classList.add(className);
  if (btn._flashIconTimer) clearTimeout(btn._flashIconTimer);
  btn._flashIconTimer = setTimeout(() => {
    btn.innerHTML = btn.dataset.flashIconHtml || oldHtml;
    if (className) btn.classList.remove(className);
    btn._flashIconTimer = null;
  }, ms);
}

function downloadTextFile(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([String(text || '')], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function applyBooksSearchInPlace() {
  const q = (state.booksSearch || '').trim().toLowerCase();
  const nodes = document.querySelectorAll('.book-card[data-book-id], .books-table tbody tr[data-book-id]');
  if (!nodes.length) return;
  let visible = 0;
  nodes.forEach((node) => {
    const hay = (node.dataset.searchText || node.textContent || '').toLowerCase();
    const show = !q || hay.includes(q);
    node.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });
  const countEl = document.getElementById('booksCountValue');
  if (countEl) countEl.textContent = fmtNumber(visible);
}

function applyHighlightsSearchInPlace() {
  const q = (state.highlightsSearch || '').trim().toLowerCase();
  const groups = document.querySelectorAll('.highlight-group');
  if (!groups.length) return;
  let visibleGroups = 0;
  let visibleItems = 0;
  groups.forEach((group) => {
    const cards = group.querySelectorAll('.annotation-card');
    let groupVisibleItems = 0;
    cards.forEach((card) => {
      const hay = (card.dataset.searchText || card.textContent || '').toLowerCase();
      const show = !q || hay.includes(q);
      card.style.display = show ? '' : 'none';
      if (show) groupVisibleItems += 1;
    });
    const body = group.querySelector('.highlight-group-body');
    const emptyInline = group.querySelector('.highlight-group-empty');
    if (emptyInline) emptyInline.style.display = groupVisibleItems ? 'none' : '';
    if (body) body.style.display = group.classList.contains('collapsed') ? 'none' : '';
    group.style.display = (!q || groupVisibleItems > 0) ? '' : 'none';
    if (!q || groupVisibleItems > 0) visibleGroups += 1;
    visibleItems += groupVisibleItems;
  });
  const summaryEl = document.getElementById('hlSummaryNote');
  if (summaryEl) summaryEl.textContent = t('%1 items across %2 books', fmtNumber(visibleItems), fmtNumber(visibleGroups));
}

function fmtNumber(n) {
  return new Intl.NumberFormat('en-US').format(Number(n) || 0);
}

function formatDuration(secs) {
  secs = Math.round(Number(secs) || 0);
  if (secs <= 0) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h === 0) return `${m || 1}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDurationLong(secs) {
  secs = Math.round(Number(secs) || 0);
  if (secs <= 0) return t('No reading yet');
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (!h && !m) return t('Less than a minute');
  if (!h) return t('%1 minutes', m);
  if (!m) return t('%1 hours', h);
  return t('%1 hours %2 minutes', h, m);
}

function shortDuration(secs) {
  secs = Math.round(Number(secs) || 0);
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}`;
}

function formatRelativeDate(ts) {
  if (!ts) return '';
  const diff = Math.round((Date.now() - Number(ts) * 1000) / 1000);
  if (diff < 60) return t('just now');
  if (diff < 3600) return t('%1m ago', Math.round(diff / 60));
  if (diff < 86400) return t('%1h ago', Math.round(diff / 3600));
  if (diff < 604800) return t('%1d ago', Math.round(diff / 86400));
  if (diff < 2592000) return t('%1w ago', Math.round(diff / 604800));
  return t('%1mo ago', Math.round(diff / 2592000));
}

function formatDateLabel(ymd) {
  if (!ymd) return '';
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString(UI_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString(UI_LOCALE, { month: 'short' });
}

function formatAnnotationDate(dt) {
  if (!dt) return '';
  try {
    const d = new Date(String(dt).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return String(dt);
    return d.toLocaleString(UI_LOCALE, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return String(dt);
  }
}

function formatSessionTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(Number(ts) * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(UI_LOCALE, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function parseDateLike(value) {
  if (!value) return null;
  try {
    const d = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function getAnnotationKind(a) {
  const hasText = !!(a?.text && String(a.text).trim());
  const hasNote = !!(a?.note && String(a.note).trim());
  if (hasText && hasNote) return 'note';
  if (hasText) return 'highlight';
  return 'bookmark';
}

function normalizeTitle(s) {
  return String(s || '').trim().toLowerCase();
}

function normalizeLooseTitle(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/z-library|zlibrary|1lib\.sk|z-lib\.sk/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBookRef(value) {
  const v = String(value ?? '').trim();
  return v || '';
}

function encBookRef(value) {
  return encodeURIComponent(getBookRef(value));
}

function bookCoverUrl(bookRef) {
  return `/api/books/${encBookRef(bookRef)}/cover?v=${state.coverVersion || 0}`;
}

function buildStatsIndexes(statsBooks = []) {
  const byMd5 = new Map();
  const byTitleAuthor = new Map();
  const byTitle = {};
  for (const s of toArray(statsBooks)) {
    if (!s) continue;
    if (s.md5 && !byMd5.has(String(s.md5))) byMd5.set(String(s.md5), s);
    const titleKey = normalizeTitle(s.title);
    if (titleKey && !byTitle[titleKey]) byTitle[titleKey] = s;
    const taKey = `${normalizeLooseTitle(s.title)}::${normalizeLooseTitle(s.authors)}`;
    if (taKey !== '::' && !byTitleAuthor.has(taKey)) byTitleAuthor.set(taKey, s);
  }
  return { byMd5, byTitleAuthor, byTitle };
}

function annotationFingerprint(a) {
  const kind = getAnnotationKind(a);
  return [
    String(a?.book_ref || ''),
    String(a?.book_md5 || ''),
    String(a?.book_id || ''),
    String(a?.book_title || '').trim(),
    String(a?.book_authors || '').trim(),
    kind,
    String(a?.text || '').trim(),
    String(a?.note || '').trim(),
    String(a?.chapter || '').trim(),
    String(a?.pageno || ''),
    String(a?.page || ''),
    String(a?.pos0 || ''),
    String(a?.pos1 || ''),
    String(a?.datetime || a?.datetime_updated || '').trim(),
  ].join('||');
}

function dedupeAnnotationsForDisplay(items = []) {
  const seen = new Set();
  const out = [];
  for (const a of toArray(items)) {
    const fp = annotationFingerprint(a);
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push(a);
  }
  return out;
}

function startOfDay(d) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ============================================================
   Icons
   ============================================================ */
const IC = {
  books: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 6a9 9 0 0 0-7-2v14a9 9 0 0 1 7 2m0-14a9 9 0 0 1 7-2v14a9 9 0 0 0-7 2m0-14v14"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V12m8 7V5m8 14v-9"/><path d="M2 19h20"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3v3M17 3v3M4 9h16"/><rect x="4" y="5" width="16" height="16" rx="2"/></svg>',
  highlight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 11 4 4L20 8l-4-4-7 7z"/><path d="M4 20h7"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>',
  page: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 16 4-4 3 3 7-8"/><path d="M5 20h14"/></svg>',
  streak: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 6 13h5l-1 9 8-12h-5z"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v10"/><path d="m8 10 4 4 4-4"/><path d="M4 19h16"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 13 4 4L19 7"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  shot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 .3-7.49 6.75 6.75 0 0 0-13.2-1.03A4.5 4.5 0 0 0 2.25 15z"/></svg>',
};

function icon(name, size = 16) {
  const svg = IC[name] || '';
  return svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
}

/* ============================================================
   Tooltip
   ============================================================ */
let tooltipEl;
let activeTooltipTarget = null;
let tooltipVisualTarget = null;
let tooltipGlobalsInstalled = false;
function ensureTooltip() {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'kd-tooltip';
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}
function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.remove('visible');
  if (tooltipVisualTarget) tooltipVisualTarget.classList.remove('tip-active');
  tooltipVisualTarget = null;
  activeTooltipTarget = null;
}
function positionTooltip(x, y) {
  const tip = ensureTooltip();
  const margin = 10;
  const vw = window.innerWidth || document.documentElement.clientWidth || 0;
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  tip.style.left = '0px';
  tip.style.top = '0px';
  const rect = tip.getBoundingClientRect();
  let left = x;
  let top = y;
  if (vw > 0) left = Math.max(margin, Math.min(left, vw - rect.width - margin));
  if (vh > 0) top = Math.max(margin, Math.min(top, vh - rect.height - margin));
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}
function showTooltip(el, pos = {}) {
  if (!el) return;
  if (tooltipVisualTarget && tooltipVisualTarget !== el) tooltipVisualTarget.classList.remove('tip-active');
  tooltipVisualTarget = el;
  tooltipVisualTarget.classList.add('tip-active');
  const tip = ensureTooltip();
  tip.innerHTML = esc(el.dataset.tip || '');
  tip.classList.add('visible');
  const rect = el.getBoundingClientRect();
  const x = Number.isFinite(pos.clientX) ? pos.clientX + 14 : (rect.left + rect.width / 2);
  let y = Number.isFinite(pos.clientY) ? pos.clientY + 14 : (rect.top - 10);
  if (!Number.isFinite(pos.clientY)) {
    tip.style.left = '0px';
    tip.style.top = '0px';
    const tipRect = tip.getBoundingClientRect();
    if (rect.top > tipRect.height + 18) y = rect.top - tipRect.height - 10;
    else y = rect.bottom + 10;
  }
  positionTooltip(x, y);
}
function installGlobalTooltipDismiss() {
  if (tooltipGlobalsInstalled) return;
  tooltipGlobalsInstalled = true;
  window.addEventListener('scroll', hideTooltip, { passive: true });
  window.addEventListener('resize', hideTooltip, { passive: true });
  document.addEventListener('pointerdown', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return hideTooltip();
    if (!t.closest('[data-tip]')) hideTooltip();
  }, true);
  document.addEventListener('touchstart', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return hideTooltip();
    if (!t.closest('[data-tip]')) hideTooltip();
  }, { passive: true, capture: true });
}
function bindTooltips(root = document) {
  ensureTooltip();
  installGlobalTooltipDismiss();
  root.querySelectorAll('[data-tip]').forEach((el) => {
    if (el.dataset.tipBound) return;
    el.dataset.tipBound = '1';
    el.addEventListener('mousemove', (e) => {
      showTooltip(el, { clientX: e.clientX, clientY: e.clientY });
      activeTooltipTarget = null;
    });
    el.addEventListener('mouseleave', () => {
      if (activeTooltipTarget !== el) hideTooltip();
    });
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      if (activeTooltipTarget === el && tooltipEl?.classList.contains('visible')) {
        hideTooltip();
        return;
      }
      activeTooltipTarget = el;
      showTooltip(el);
    });
    el.addEventListener('pointercancel', () => {
      if (activeTooltipTarget === el) hideTooltip();
    });
    if (!window.PointerEvent) {
      el.addEventListener('touchstart', () => {
        if (activeTooltipTarget === el && tooltipEl?.classList.contains('visible')) {
          hideTooltip();
          return;
        }
        activeTooltipTarget = el;
        showTooltip(el);
      }, { passive: true });
    }
  });
}

function renderCoverPullStatus(job) {
  if (!job) return '';
  if (!job.running && state.coverPullDismissed) return '';
  const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
  const errors = Array.isArray(job.errors) ? job.errors.slice(0, 3) : [];
  const isPaused = !!job.paused;
  return `
    <div class="cover-pull-box panel-subtle ${job.running ? 'running' : ''}">
      <div class="cover-pull-head">
        <div>
          <div class="cover-pull-title">${job.running ? (isPaused ? 'Cover pull paused' : 'Pulling covers…') : 'Cover pull complete'}</div>
          <div class="cover-pull-sub">
            This may take a while depending on your library size and network speed.
            ${job.current ? ` Current: ${esc(job.current)}` : ''}
          </div>
        </div>
        <div class="cover-pull-stats">
          ${job.running ? `<button class="ghost-btn tiny" type="button" id="pauseCoversBtn">${isPaused ? 'Resume' : 'Pause'}</button>` : ''}
          <span>${fmtNumber(job.done)}/${fmtNumber(job.total)} · ${pct}%</span>
          ${!job.running ? `<button class="ghost-btn tiny icon-only-btn cover-pull-close-btn" type="button" id="closeCoverPullStatusBtn" title="Close" aria-label="Close">${icon('close', 14)}</button>` : ''}
        </div>
      </div>
      <div class="cover-pull-progress"><div style="width:${pct}%"></div></div>
      <div class="cover-pull-meta">
        <span>${t('%1 saved', fmtNumber(job.saved || 0))}</span>
        <span>${t('%1 skipped', fmtNumber(job.skipped || 0))}</span>
        <span>${t('%1 failed', fmtNumber(job.failed || 0))}</span>
      </div>
      ${errors.length ? `<div class="cover-pull-errors">${errors.map((e) => `<div>${esc(e)}</div>`).join('')}</div>` : ''}
    </div>`;
}

function bindCoverPullJobEvents() {
  document.getElementById('pauseCoversBtn')?.addEventListener('click', () => {
    if (!state.coverPullJob?.running) return;
    state.coverPullJob.paused = !state.coverPullJob.paused;
    renderBooksProgressOnly();
  });
  document.getElementById('closeCoverPullStatusBtn')?.addEventListener('click', () => {
    state.coverPullDismissed = true;
    document.querySelector('.cover-pull-box')?.remove();
  });
}

/* ============================================================
   Cover Renderer (local generated cover)
   ============================================================ */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function getBookCoverTheme(book) {
  const seed = hashString(`${book.title || ''}::${book.authors || ''}`);
  const hue = 206 + (seed % 24);       // blue/ink range
  // Rose range on the dark theme; teal/cyan range on the light (day) theme.
  const light = document.documentElement.getAttribute('data-color-scheme') === 'light';
  const hue2 = light ? 170 + (seed % 20) : 334 + (seed % 16);
  const hue3 = 232 + ((seed >> 5) % 18); // indigo range
  const patternIdx = seed % 4;
  const accent = (seed >> 8) % 100;
  return { seed, hue, hue2, hue3, patternIdx, accent };
}

function coverTitleLines(title) {
  const words = String(title || 'Untitled').split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [words.join(' ')];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
}

function renderBookCover(book, { variant = 'grid', compact = false } = {}) {
  const t = getBookCoverTheme(book || {});
  const lines = coverTitleLines(book.title || 'Untitled');
  const author = (book.authors || '').split(',')[0] || '';
  const first = ((book.title || '?').match(/[A-Za-z0-9\u4e00-\u9fff]/) || ['?'])[0].toUpperCase();
  const patternClass = `pattern-${t.patternIdx}`;
  const style = [
    `--h1:${t.hue}`,
    `--h2:${t.hue2}`,
    `--h3:${t.hue3}`,
    `--accent:${t.accent}`,
  ].join(';');
  const seedAttr = `data-cover-seed="${t.seed}"`;

  if (variant === 'thumb') {
    return `
      <div class="book-cover thumb ${patternClass}" ${seedAttr} style="${style}">
        ${book && book.cover_url ? `<img class="book-cover-img" src="${esc(book.cover_url)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <div class="book-cover-thumb-badge">${esc(first)}</div>
      </div>`;
  }

  if (variant === 'hero') {
    return `
      <div class="book-cover hero ${patternClass}" ${seedAttr} style="${style}">
        ${book && book.cover_url ? `<img class="book-cover-img" src="${esc(book.cover_url)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <div class="book-cover-noise"></div>
        <div class="book-cover-mark">${esc(first)}</div>
        <div class="book-cover-hero-meta">${author ? esc(author) : 'Unknown author'}</div>
        <div class="book-cover-title-wrap">
          ${lines.map(l => `<div class="book-cover-title-line">${esc(l)}</div>`).join('')}
        </div>
      </div>`;
  }

  return `
    <div class="book-cover ${compact ? 'compact' : ''} ${patternClass}" ${seedAttr} style="${style}">
      ${book && book.cover_url ? `<img class="book-cover-img" src="${esc(book.cover_url)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <div class="book-cover-noise"></div>
      <div class="book-cover-mark">${esc(first)}</div>
      <div class="book-cover-title-wrap">
        ${lines.map(l => `<div class="book-cover-title-line">${esc(l)}</div>`).join('')}
      </div>
      <div class="book-cover-author">${author ? esc(author) : '&nbsp;'}</div>
    </div>`;
}

/* Recolor existing generated book covers in place when the theme changes:
   the rose hue2 range (dark) becomes teal/cyan (light). No full re-render, so
   it cannot race with other renders. */
function recolorCovers() {
  const light = html.getAttribute('data-color-scheme') === 'light';
  document.querySelectorAll('.book-cover[data-cover-seed]').forEach((el) => {
    const seed = Number(el.dataset.coverSeed) || 0;
    el.style.setProperty('--h2', String(light ? 170 + (seed % 20) : 334 + (seed % 16)));
  });
}

/* Export the current content view as a PNG screenshot (downloads a file).
   Renders the live DOM through html-to-image (SVG foreignObject), so the
   browser's real CSS engine draws it — color-mix and all. The lib is loaded
   lazily from esm.sh on first use, matching the existing @jsquash/webp CDN
   pattern. */
async function exportPagePng() {
  const btn = document.getElementById('shotBtn');
  if (!btn || btn.disabled) return;
  const content = document.getElementById('content');
  if (!content) return;
  btn.disabled = true;
  const oldTitle = btn.title;
  btn.title = t('Capturing…');
  btn.setAttribute('aria-label', btn.title);
  try {
    const { toPng } = await import('https://esm.sh/html-to-image@1.11.11');
    const dataUrl = await toPng(content, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: getComputedStyle(document.body).backgroundColor || undefined,
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `kocloud-${state.view}-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    flashButtonTitle(btn, t('PNG saved'));
  } catch (e) {
    console.error('PNG export failed', e);
    window.alert(t('Screenshot failed: %1', e && e.message ? e.message : String(e)));
  } finally {
    btn.disabled = false;
    btn.title = oldTitle;
    btn.setAttribute('aria-label', oldTitle);
  }
}

/* ============================================================
   Navigation & Theme
   ============================================================ */
const $content = document.getElementById('content');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const html = document.documentElement;

function setupChrome() {
  const savedScheme = lsGet('kd-theme');
  html.setAttribute('data-color-scheme', savedScheme === 'light' || savedScheme === 'dark' ? savedScheme : 'light');

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.view);
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  });

  const shotBtn = document.getElementById('shotBtn');
  if (shotBtn) {
    shotBtn.innerHTML = icon('shot', 16);
    shotBtn.title = t('Export page as PNG');
    shotBtn.setAttribute('aria-label', shotBtn.title);
    shotBtn.addEventListener('click', exportPagePng);
  }

  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    const applyThemeBtn = () => {
      const dark = html.getAttribute('data-color-scheme') === 'dark';
      themeBtn.innerHTML = icon(dark ? 'sun' : 'moon', 16);
      themeBtn.title = t(dark ? 'Switch to light theme' : 'Switch to dark theme');
      themeBtn.setAttribute('aria-label', themeBtn.title);
    };
    applyThemeBtn();
    themeBtn.addEventListener('click', () => {
      const next = html.getAttribute('data-color-scheme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-color-scheme', next);
      lsSet('kd-theme', next);
      applyThemeBtn();
      recolorCovers(); // recolor generated covers in place, no re-render
    });
  }

  const disconnectBtn = document.getElementById('disconnectBtn');
  if (disconnectBtn) {
    disconnectBtn.innerHTML = `${icon('close', 14)} Disconnect`;
    disconnectBtn.addEventListener('click', async () => {
      const confirmed = window.confirm(t('Disconnect current client and stop KoCloud server now?'));
      if (!confirmed) return;
      disconnectBtn.disabled = true;
      disconnectBtn.textContent = 'Disconnecting...';
      try {
        await apiNoCachePost('server/stop');
        disconnectBtn.textContent = 'Disconnected';
        disconnectBtn.classList.add('is-done');
        hideTooltip();
        $content.innerHTML = `
          <section class="panel empty-panel">
            <h2>Connection closed</h2>
            <p>KoCloud server has been stopped. Restart it from KOReader menu when needed.</p>
          </section>`;
      } catch (e) {
        disconnectBtn.disabled = false;
        disconnectBtn.innerHTML = `${icon('close', 14)} Disconnect`;
        window.alert(t('Disconnect failed: %1', e?.message || e));
      }
    });
  }
}

function navigate(view, params = {}) {
  hideTooltip();
  clearCloudPoll(); // leave the cloud page stops any running activity poll
  state.view = view;
  Object.assign(state, params);
  updateActiveNav();
  render();
}

function updateActiveNav() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    const active = link.dataset.view === state.view || (state.view === 'book' && link.dataset.view === 'books');
    link.classList.toggle('active', active);
  });
}

/* ============================================================
   Data adapters
   ============================================================ */
function findBestStatsMatch(book, statsBooks = [], statsIndexes = null) {
  if (!book) return null;
  const indexes = statsIndexes || buildStatsIndexes(statsBooks);
  if (book.md5) {
    const byMd5 = indexes.byMd5.get(String(book.md5));
    if (byMd5) return byMd5;
  }
  const exactTa = indexes.byTitleAuthor.get(`${normalizeLooseTitle(book.title)}::${normalizeLooseTitle(book.authors)}`);
  if (exactTa) return exactTa;
  const exact = indexes.byTitle[normalizeTitle(book.title)];
  if (exact) return exact;

  const bt = normalizeLooseTitle(book.title);
  const ba = normalizeLooseTitle(book.authors);
  if (!bt) return null;

  let best = null;
  let bestScore = 0;
  for (const s of toArray(statsBooks)) {
    const st = normalizeLooseTitle(s.title);
    if (!st) continue;
    let score = 0;
    if (st === bt) score += 100;
    if (st.includes(bt) || bt.includes(st)) score += 55;
    const sa = normalizeLooseTitle(s.authors);
    if (ba && sa) {
      if (sa === ba) score += 25;
      else if (sa.includes(ba) || ba.includes(sa)) score += 12;
    }
    if ((book.pages || 0) && (s.pages || 0) && Number(book.pages) === Number(s.pages)) score += 20;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore >= 40 ? best : null;
}

function getBookStatusTag(book) {
  const st = String(book.status || '').toLowerCase();
  if (st === 'finished' || st === 'complete') return 'finished';
  if ((book.percent || 0) > 0) return 'reading';
  return 'queued';
}

function dedupeBooksForDisplay(books = []) {
  const bestByKey = new Map();

  function scoreBookForDisplay(b) {
    let score = 0;
    if (b.md5) score += 20;
    if (b.cover_available) score += 12;
    if (b.authors && !/unknown author/i.test(String(b.authors))) score += 10;
    if ((b.pages || 0) > 0) score += 8;
    if ((b.percent || 0) > 0) score += 6;
    if ((b.highlights || 0) > 0) score += 4;
    return score;
  }

  function isBetterDisplayCandidate(next, prev) {
    const nt = Number(next?.last_open_ts) || 0;
    const pt = Number(prev?.last_open_ts) || 0;
    if (nt !== pt) return nt > pt;
    const ns = scoreBookForDisplay(next);
    const ps = scoreBookForDisplay(prev);
    if (ns !== ps) return ns > ps;
    return String(next?.id || '') > String(prev?.id || '');
  }

  for (const b of toArray(books)) {
    const md5Key = b?.md5 ? `md5:${String(b.md5)}` : '';
    const titleKey = normalizeLooseTitle(b?.title || '');
    const authorKey = normalizeLooseTitle(b?.authors || '');
    const pagesKey = Number(b?.pages || 0) > 0 ? String(Number(b.pages)) : '';
    const dedupeKey = md5Key
      || (titleKey ? `ta:${titleKey}::${authorKey}::${pagesKey}` : '')
      || (titleKey ? `t:${titleKey}` : '');
    if (!dedupeKey) {
      bestByKey.set(`__${bestByKey.size}`, b);
      continue;
    }
    const prev = bestByKey.get(dedupeKey);
    if (!prev || isBetterDisplayCandidate(b, prev)) {
      bestByKey.set(dedupeKey, b);
    }
  }
  return [...bestByKey.values()];
}

function buildLibraryCoverResolver(books = []) {
  const byMd5 = new Map();
  const byTitleAuthor = new Map();
  const byTitle = new Map();

  for (const b of toArray(books)) {
    const cover_url = bookCoverUrl(b.id);
    const enriched = { ...b, cover_url };
    if (b.md5) byMd5.set(String(b.md5), enriched);
    const taKey = `${normalizeLooseTitle(b.title)}::${normalizeLooseTitle(b.authors)}`;
    if (!byTitleAuthor.has(taKey)) byTitleAuthor.set(taKey, enriched);
    const tKey = normalizeLooseTitle(b.title);
    if (tKey && !byTitle.has(tKey)) byTitle.set(tKey, enriched);
  }

  return function resolve(item) {
    if (!item) return item;
    if (item.book_ref) {
      return { ...item, cover_url: bookCoverUrl(item.book_ref) };
    }
    if (item.book_id) {
      return { ...item, cover_url: bookCoverUrl(item.book_id) };
    }
    if (item.md5 && byMd5.has(String(item.md5))) {
      const m = byMd5.get(String(item.md5));
      return { ...item, cover_url: m.cover_url };
    }
    const taKey = `${normalizeLooseTitle(item.title)}::${normalizeLooseTitle(item.authors)}`;
    if (byTitleAuthor.has(taKey)) {
      return { ...item, cover_url: byTitleAuthor.get(taKey).cover_url };
    }
    const tKey = normalizeLooseTitle(item.title);
    if (byTitle.has(tKey)) {
      return { ...item, cover_url: byTitle.get(tKey).cover_url };
    }
    return item;
  };
}

function getDashboardFallbackShape() {
  return {
    summary: {
      total_books: 0, reading_books: 0, finished_books: 0,
      total_read_time_sec: 0, total_read_pages: 0, total_highlights: 0, total_notes: 0,
      active_days_90d: 0, best_streak_days: 0, current_streak_days: 0, last_read_date: ''
    },
    kpis: {
      last_7_days_time_sec: 0, last_30_days_time_sec: 0, avg_daily_time_30d_sec: 0, longest_day_sec: 0,
      books_touched_30d: 0, books_touched_90d: 0, books_touched_180d: 0, books_touched_365d: 0
    },
    series: {
      daily_90d: [], daily_180d: [], daily_365d: [],
      monthly_12m: [], weekday_avg: [],
      hourly_activity: [], hourly_activity_30d: [], hourly_activity_90d: [], hourly_activity_180d: [], hourly_activity_365d: []
    },
    calendar: { days: [], legend: { max_daily_sec_90d: 0 } },
    top_books: {
      by_time: [], by_pages: [],
      by_time_30d: [], by_time_90d: [], by_time_180d: [], by_time_365d: [],
      by_pages_30d: [], by_pages_90d: [], by_pages_180d: [], by_pages_365d: []
    }
  };
}

async function getDashboard() {
  try {
    return await api('dashboard');
  } catch (e) {
    console.warn('Dashboard API failed, falling back', e);
    return getDashboardFallbackShape();
  }
}

/* ============================================================
   Main render
   ============================================================ */
async function render() {
  hideTooltip();
  const token = ++renderToken;
  const loadingTimer = setTimeout(() => {
    if (token !== renderToken) return;
    $content.innerHTML = '<div class="loading-shell"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>';
  }, 140);
  try {
    if (state.view === 'books') return await renderBooks();
    if (state.view === 'book') return await renderBook();
    if (state.view === 'stats') return await renderStats();
    if (state.view === 'calendar') return await renderCalendar();
    if (state.view === 'highlights') return await renderHighlights();
    if (state.view === 'cloud') return await renderCloud();
    return await renderBooks();
  } catch (e) {
    console.error(e);
    $content.innerHTML = `
      <section class="panel empty-panel">
        <h2>Failed to load dashboard</h2>
        <p>${esc(e.message || String(e))}</p>
      </section>`;
  } finally {
    clearTimeout(loadingTimer);
  }
}

/* ============================================================
   Books page
   ============================================================ */
async function renderBooks() {
  const bookToken = renderToken;
  const [dash, booksResp, statsResp] = await Promise.all([
    getDashboard(),
    api('books'),
    api('stats').catch(() => ({ books: [], daily: [] })),
  ]);

  const statsBooks = toArray(statsResp.books);
  const allBooks = dedupeBooksForDisplay(toArray(booksResp.books));
  allBooks.forEach((b) => { b.cover_url = bookCoverUrl(b.id); });
  const statsIndexes = buildStatsIndexes(statsBooks);

  let books = allBooks.filter((b) => {
    const q = state.booksSearch.trim().toLowerCase();
    if (q && !`${b.title || ''} ${b.authors || ''}`.toLowerCase().includes(q)) return false;
    if (state.booksFilter === 'reading') return getBookStatusTag(b) === 'reading';
    if (state.booksFilter === 'finished') return getBookStatusTag(b) === 'finished';
    if (state.booksFilter === 'highlighted') return (b.highlights || 0) > 0;
    return true;
  });

  books.sort((a, b) => {
    const dir = state.booksSortDir === 'asc' ? 1 : -1;
    const sa = findBestStatsMatch(a, statsBooks, statsIndexes) || {};
    const sb = findBestStatsMatch(b, statsBooks, statsIndexes) || {};
    let av;
    let bv;
    switch (state.booksSortKey) {
      case 'title': av = a.title || ''; bv = b.title || ''; break;
      case 'percent': av = a.percent || 0; bv = b.percent || 0; break;
      case 'highlights': av = a.highlights || 0; bv = b.highlights || 0; break;
      case 'total_read_time': av = sa.total_read_time || 0; bv = sb.total_read_time || 0; break;
      default: av = a.last_open_ts || 0; bv = b.last_open_ts || 0;
    }
    if (typeof av === 'string') {
      av = av.toLowerCase(); bv = String(bv || '').toLowerCase();
    }
    return av < bv ? -dir : av > bv ? dir : 0;
  });

  const s = dash.summary || {};
  const heroCards = [
    { label: 'Library', value: fmtNumber(s.total_books), sub: 'books tracked', icon: 'books' },
    { label: 'In Progress', value: `${fmtNumber(s.reading_books)}/${fmtNumber(s.finished_books)}`, sub: 'reading / finished', icon: 'spark' },
    { label: 'Reading Time', value: formatDuration(s.total_read_time_sec), sub: 'all time', icon: 'clock' },
    { label: 'Annotations', value: fmtNumber((s.total_highlights || 0) + (s.total_notes || 0)), sub: t('%1 highlights · %2 notes', fmtNumber(s.total_highlights || 0), fmtNumber(s.total_notes || 0)), icon: 'highlight' },
  ];
  if (bookToken !== renderToken) return; // stale: a newer navigation happened

  $content.innerHTML = `
    <div class="view-fade">
      <section class="hero-shell">
        <div class="hero-copy">
          <div class="eyebrow">KoReader dashboard</div>
          <h1 class="hero-title">Your reading dashboard, redesigned.</h1>
          <p class="hero-sub">Books, highlights, progress, and calendar activity in one place.</p>
        </div>
        <div class="hero-grid">
          ${heroCards.map(c => `
            <article class="hero-card panel">
              <div class="hero-card-head"><span>${esc(c.label)}</span><span class="ic">${icon(c.icon, 16)}</span></div>
              <div class="hero-card-value">${esc(String(c.value))}</div>
              <div class="hero-card-sub">${esc(c.sub)}</div>
            </article>`).join('')}
        </div>
      </section>

      <section class="panel controls-panel">
        <div class="toolbar-row toolbar-row-books">
          <div class="search-box">
            <span class="ic">${icon('search', 16)}</span>
            <input id="booksSearch" type="text" placeholder="Search title or author" value="${esc(state.booksSearch)}">
          </div>
          <div class="filter-pills" role="tablist" aria-label="Book filters">
            ${['all','reading','finished','highlighted'].map(k => {
              const labels = { all:'All', reading:'Reading', finished:'Finished', highlighted:'With highlights' };
              return `<button class="pill month-pill ${state.booksFilter === k ? 'active' : ''}" data-books-filter="${k}">${esc(labels[k])}</button>`;
            }).join('')}
          </div>
          <div class="toolbar-right">
            <label class="select-wrap">Sort
              <select id="booksSortKey">
                <option value="last_open_ts" ${state.booksSortKey === 'last_open_ts' ? 'selected' : ''}>Last open</option>
                <option value="percent" ${state.booksSortKey === 'percent' ? 'selected' : ''}>Progress</option>
                <option value="title" ${state.booksSortKey === 'title' ? 'selected' : ''}>Title</option>
                <option value="total_read_time" ${state.booksSortKey === 'total_read_time' ? 'selected' : ''}>Read time</option>
                <option value="highlights" ${state.booksSortKey === 'highlights' ? 'selected' : ''}>Highlights</option>
              </select>
            </label>
            <button class="ghost-btn" id="sortDirBtn">${state.booksSortDir === 'asc' ? '↑' : '↓'} ${t(state.booksSortDir === 'asc' ? 'Asc' : 'Desc')}</button>
          </div>
        </div>
        ${renderCoverPullStatus(state.coverPullJob)}
      </section>

      <section class="panel library-panel">
        <div class="section-head">
          <div>
            <div class="section-kicker">Library</div>
            <h2><span id="booksCountValue">${fmtNumber(books.length)}</span> books</h2>
          </div>
          <div class="library-head-right">
            <div class="segmented books-view-toggle" role="tablist" aria-label="View mode">
              <button class="seg-btn icon-only-btn ${state.booksMode === 'grid' ? 'active' : ''}" type="button" data-books-mode="grid" aria-label="Grid view" aria-pressed="${state.booksMode === 'grid' ? 'true' : 'false'}" title="Grid view">${icon('grid', 14)}</button>
              <button class="seg-btn icon-only-btn ${state.booksMode === 'table' ? 'active' : ''}" type="button" data-books-mode="table" aria-label="Table view" aria-pressed="${state.booksMode === 'table' ? 'true' : 'false'}" title="Table view">${icon('table', 14)}</button>
            </div>
            <button class="ghost-btn" id="pullCoversBtn" ${state.coverPullJob?.running ? 'disabled' : ''}>
              ${icon('spark', 14)} ${state.coverPullJob?.running ? 'Pulling covers…' : 'Pull Covers'}
            </button>
          </div>
        </div>
        ${books.length ? (state.booksMode === 'grid' ? buildBooksGrid(books, statsIndexes, statsBooks) : buildBooksTable(books, statsIndexes, statsBooks)) : '<div class="empty-inline">No books match your filters.</div>'}
      </section>
    </div>`;

  bindBooksEvents();
  bindBookClicks();
  bindTooltips($content);
}

function bindBooksEvents() {
  const searchEl = document.getElementById('booksSearch');
  let composing = false;
  searchEl?.addEventListener('compositionstart', () => { composing = true; });
  searchEl?.addEventListener('compositionend', (e) => {
    composing = false;
    state.booksSearch = e.target.value || '';
    debounceRun('booksSearch', () => applyBooksSearchInPlace(), 140);
  });
  searchEl?.addEventListener('input', (e) => {
    state.booksSearch = e.target.value || '';
    if (composing) return;
    debounceRun('booksSearch', () => applyBooksSearchInPlace(), 140);
  });
  document.querySelectorAll('[data-books-mode]').forEach((btn) => btn.addEventListener('click', () => {
    state.booksMode = btn.dataset.booksMode;
    savePrefs();
    renderBooks();
  }));
  document.querySelectorAll('[data-books-filter]').forEach((btn) => btn.addEventListener('click', () => {
    state.booksFilter = btn.dataset.booksFilter;
    savePrefs();
    renderBooks();
  }));
  document.getElementById('booksSortKey')?.addEventListener('change', (e) => {
    state.booksSortKey = e.target.value;
    savePrefs();
    renderBooks();
  });
  document.getElementById('sortDirBtn')?.addEventListener('click', () => {
    state.booksSortDir = state.booksSortDir === 'asc' ? 'desc' : 'asc';
    savePrefs();
    renderBooks();
  });
  document.getElementById('pullCoversBtn')?.addEventListener('click', async () => {
    if (state.coverPullJob && state.coverPullJob.running) return; // one pull at a time
    const booksResp = await api('books');
    const allBooks = dedupeBooksForDisplay(toArray(booksResp.books));
    if (!allBooks.length) return;

    state.coverPullJob = {
      running: true,
      total: allBooks.length,
      done: 0,
      saved: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      current: '',
      startedAt: Date.now(),
      paused: false,
    };
    state.coverPullDismissed = false;
    renderBooks();

    for (const b of allBooks) {
      while (state.coverPullJob?.running && state.coverPullJob.paused) {
        renderBooksProgressOnly();
        await sleep(120);
      }
      if (!state.coverPullJob?.running) break;
      state.coverPullJob.current = b.title || 'Untitled';
      renderBooksProgressOnly();
      try {
        const res = await apiNoCache(`books/${encBookRef(b.id)}/fetch-cover`);
        if (res?.saved) {
          const up = await compressAndUploadBookCover(b.id);
          if (up?.saved) state.coverPullJob.saved += 1;
          else state.coverPullJob.skipped += 1;
        } else if (res?.skipped) {
          state.coverPullJob.skipped += 1;
        } else {
          state.coverPullJob.failed += 1;
          if (state.coverPullJob.errors.length < 6) {
            const parts = [];
            if (res?.error) parts.push(res.error);
            if (res?.tried_query) parts.push(`tried: ${res.tried_query}`);
            if (res?.fallback_error) parts.push(`epub: ${res.fallback_error}`);
            state.coverPullJob.errors.push(`${b.title || 'Untitled'}: ${parts.join(' | ') || 'unknown error'}`);
          }
        }
      } catch (e) {
        state.coverPullJob.failed += 1;
        if (state.coverPullJob.errors.length < 6) {
          state.coverPullJob.errors.push(`${b.title || 'Untitled'}: ${e?.message || 'request failed'}`);
        }
      }
      state.coverPullJob.done += 1;
      renderBooksProgressOnly();
    }

    state.coverPullJob.running = false;
    state.coverPullJob.current = '';
    state.coverVersion = (state.coverVersion || 0) + 1;
    invalidateApiCache('books');
    renderBooks();
  });
  bindCoverPullJobEvents();
}

function renderBooksProgressOnly() {
  const host = document.querySelector('.cover-pull-box');
  if (!host || !state.coverPullJob) return;
  host.outerHTML = renderCoverPullStatus(state.coverPullJob);
  const btn = document.getElementById('pullCoversBtn');
  if (btn) btn.disabled = !!state.coverPullJob.running;
  bindCoverPullJobEvents();
}

function bindBookClicks() {
  document.querySelectorAll('[data-book-id]').forEach((el) => {
    el.addEventListener('click', () => navigate('book', { bookId: getBookRef(el.dataset.bookId) }));
  });
}

function buildBooksGrid(books, statsIndexes, statsBooks) {
  const isMobile = window.innerWidth <= 768;
  return `
    <div class="books-grid">
      ${books.map((b) => {
        const stats = findBestStatsMatch(b, statsBooks || [], statsIndexes) || {};
        const pagesRead = b.pages ? Math.round((b.percent / 100) * b.pages) : 0;
        const tag = getBookStatusTag(b);
        return `
          <article class="book-card panel-subtle ${isMobile ? 'compact-mobile' : ''}" data-book-id="${esc(b.id)}" data-search-text="${esc(`${b.title || ''} ${b.authors || ''}`.toLowerCase())}">
            <div class="book-card-cover-wrap">${renderBookCover(b, { variant: isMobile ? 'thumb' : 'grid' })}</div>
            <div class="book-card-body">
              <div class="book-card-topline">
                <span class="status-badge ${tag}">${esc(tag)}</span>
                <span class="book-card-time">${b.last_open_ts ? esc(formatRelativeDate(b.last_open_ts)) : ''}</span>
              </div>
              <h3 class="book-card-title">${esc(b.title || 'Untitled')}</h3>
              <p class="book-card-author">${esc(b.authors || 'Unknown author')}</p>
              <div class="book-progress">
                <div class="book-progress-fill" style="width:${Math.min(100, Math.max(0, b.percent || 0))}%"></div>
              </div>
              <div class="book-card-meta">
                <span data-tip="Progress">${Math.round(b.percent || 0)}%</span>
                <span data-tip="Pages">${pagesRead || 0}/${b.pages || 0}p</span>
                <span data-tip="Read time">${stats.total_read_time ? shortDuration(stats.total_read_time) : '00:00'}</span>
                <span data-tip="Highlights">${b.highlights || 0} hl</span>
              </div>
            </div>
          </article>`;
      }).join('')}
    </div>`;
}

function buildBooksTable(books, statsIndexes, statsBooks) {
  const rows = books.map((b) => {
    const stats = findBestStatsMatch(b, statsBooks || [], statsIndexes) || {};
    const tag = getBookStatusTag(b);
    const pagesRead = b.pages ? Math.round((b.percent / 100) * b.pages) : 0;
    return `
      <tr data-book-id="${esc(b.id)}" data-search-text="${esc(`${b.title || ''} ${b.authors || ''}`.toLowerCase())}">
        <td class="book-cell">
          <div class="book-row-cover">${renderBookCover(b, { variant: 'thumb' })}</div>
          <div>
            <div class="table-title">${esc(b.title || 'Untitled')}</div>
            <div class="table-sub">${esc(b.authors || 'Unknown author')}</div>
          </div>
        </td>
        <td><span class="status-badge ${tag}">${esc(tag)}</span></td>
        <td>
          <div class="table-progress-line"><div style="width:${Math.min(100, Math.max(0, b.percent || 0))}%"></div></div>
          <div class="table-sub">${Math.round(b.percent || 0)}% · ${pagesRead}/${b.pages || 0}p</div>
        </td>
        <td>${stats.total_read_time ? shortDuration(stats.total_read_time) : '00:00'}</td>
        <td>${b.highlights || 0}</td>
        <td>${b.last_open_ts ? esc(formatRelativeDate(b.last_open_ts)) : '—'}</td>
      </tr>`;
  }).join('');

  return `
    <div class="table-shell">
      <table class="books-table">
        <thead>
          <tr><th>Book</th><th>Status</th><th>Progress</th><th>Read time</th><th>Highlights</th><th>Last open</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ============================================================
   Stats page
   ============================================================ */
async function renderStats() {
  const statsToken = renderToken;
  const [dash, booksResp] = await Promise.all([
    getDashboard(),
    api('books').catch(() => ({ books: [] })),
  ]);
  const s = dash.summary || {};
  const k = dash.kpis || {};
  const series = dash.series || {};
  const trendDays = [30, 90, 180, 365].includes(Number(state.statsTrendDays)) ? Number(state.statsTrendDays) : 90;
  const trendSeries = getTrendSeriesByDays(series, trendDays);
  const trendStreaks = getStreaksFromDailySeries(trendSeries);
  const trendActiveDays = trendSeries.filter(d => (d.duration_sec || 0) > 0).length;
  const trendLongestDay = Math.max(0, ...trendSeries.map(d => Number(d.duration_sec) || 0));
  const trendTotalTime = trendSeries.reduce((sum, d) => sum + (Number(d.duration_sec) || 0), 0);
  const monthlySeries = buildMonthlySeriesFromDaily(trendSeries);
  const weekdaySeries = buildWeekdaySeriesFromDaily(trendSeries);
  const hourlySeries = getHourlySeriesByDays(series, trendDays);
  const insights = buildInsights(dash, { trendDays, trendSeries, weekdaySeries, hourlySeries });
  const booksTouched = getBooksTouchedByDays(k, trendDays);
  // Attach real cover URLs to the top-books entries (they only carry
  // md5/title/authors from the dashboard payload, no id/cover_url).
  const allBooks = dedupeBooksForDisplay(toArray(booksResp.books));
  allBooks.forEach((b) => { b.cover_url = bookCoverUrl(b.id); });
  const coverResolver = buildLibraryCoverResolver(allBooks);
  const topByTime = getTopBooksByDays(dash.top_books || {}, 'time', trendDays).map(coverResolver);
  const topByPages = getTopBooksByDays(dash.top_books || {}, 'pages', trendDays).map(coverResolver);
  if (statsToken !== renderToken) return; // stale render
  $content.innerHTML = `
    <div class="view-fade stats-view">
      <section class="hero-shell compact">
        <div class="hero-copy">
          <div class="eyebrow">Reading analytics</div>
          <h1 class="hero-title">Patterns, pace, and momentum.</h1>
          <p class="hero-sub">A cleaner view of how and when you read, with trend, rhythm, and top books all in one place.</p>
        </div>
        <div class="hero-grid stats-hero-grid">
          ${[
            ['Best streak', `${trendStreaks.best || 0}`, t('in %1 days', trendDays), 'streak'],
            ['Current streak', `${trendStreaks.current || 0}`, t('in %1 days', trendDays), 'spark'],
            ['Range total', formatDuration(trendTotalTime), t('%1-day reading time', trendDays), 'clock'],
            ['Books touched', `${booksTouched || 0}`, t('in %1 days', trendDays), 'books'],
          ].map(([label, value, sub, ic]) => `
            <article class="hero-card panel">
              <div class="hero-card-head"><span>${esc(label)}</span><span class="ic">${icon(ic, 16)}</span></div>
              <div class="hero-card-value hero-card-value-display">${esc(value)}</div>
              <div class="hero-card-sub">${esc(sub)}</div>
            </article>`).join('')}
        </div>
      </section>

      <section class="stats-layout">
        ${buildReadingHistoryHeatmap(dash.series?.daily_365d)}
        <article class="panel feature-panel">
          <div class="section-head">
            <div><div class="section-kicker">Trend</div><h2>${t('Reading trend (%1 days)', trendDays)}</h2></div>
            <div class="stats-trend-head-right">
              <div class="segmented-inline stats-range-group" role="tablist" aria-label="Trend range">
                ${[30, 90, 180, 365].map((n) => `<button class="ghost-btn tiny month-pill ${trendDays === n ? 'is-active' : ''}" type="button" data-trend-days="${n}" aria-pressed="${trendDays === n ? 'true' : 'false'}">${n}</button>`).join('')}
              </div>
              <div class="section-note">${t('Active days: %1 · Longest day: %2', fmtNumber(trendActiveDays), formatDuration(trendLongestDay))}</div>
            </div>
          </div>
          ${buildTrendChart(trendSeries)}
        </article>

        <article class="panel side-stack insight-card">
          <div class="section-kicker">Reader insight</div>
          <div class="section-note">${t('Based on selected %1-day window', trendDays)}</div>
          <h3>${esc(insights.title)}</h3>
          <p>${esc(insights.body)}</p>
          <div class="insight-chips">
            ${insights.chips.map(c => `<span class="insight-chip">${esc(c)}</span>`).join('')}
          </div>
        </article>

        <article class="panel">
          <div class="section-head"><div><div class="section-kicker">Monthly</div><h2>Monthly reading time</h2></div></div>
          ${buildBarChart(monthlySeries.map(x => ({ label: formatMonthLabel(x.month), value: x.duration_sec || 0, tip: t('%1: %2 · %3 days', formatMonthLabel(x.month), formatDurationLong(x.duration_sec || 0), x.days_read || 0) })), { valueFormatter: formatDuration, highlightMax: true })}
        </article>

        <article class="panel">
          <div class="section-head"><div><div class="section-kicker">Rhythm</div><h2>Average by weekday</h2></div></div>
          ${buildBarChart(weekdaySeries.map(x => ({ label: x.weekday, value: x.duration_sec || 0, tip: t('%1: %2 average', t(x.weekday), formatDurationLong(x.duration_sec || 0)) })), { valueFormatter: formatDuration, highlightMax: true, chartClass: 'weekday-bars' })}
        </article>

        <article class="panel">
          <div class="section-head"><div><div class="section-kicker">When</div><h2>Hourly activity</h2></div><div class="section-note">Sessions and reading time by local hour</div></div>
          ${buildHourChart(hourlySeries)}
        </article>

        <article class="panel">
          <div class="section-head"><div><div class="section-kicker">Top books</div><h2>By reading time</h2></div></div>
          ${buildTopBooksList(topByTime, 'total_read_time_sec')}
        </article>

        <article class="panel">
          <div class="section-head"><div><div class="section-kicker">Top books</div><h2>By pages read</h2></div></div>
          ${buildTopBooksList(topByPages, 'total_read_pages')}
        </article>
      </section>
    </div>`;

  bindTooltips($content);
  document.querySelectorAll('[data-trend-days]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.statsTrendDays = Number(btn.dataset.trendDays) || 90;
      savePrefs();
      renderStats();
    });
  });
}

function buildInsights(dash, opts = {}) {
  const s = dash.summary || {};
  const k = dash.kpis || {};
  const weekdays = toArray(opts.weekdaySeries).length ? toArray(opts.weekdaySeries) : toArray(dash.series?.weekday_avg);
  const hours = toArray(opts.hourlySeries).length ? toArray(opts.hourlySeries) : toArray(dash.series?.hourly_activity);
  const topW = weekdays.slice().sort((a, b) => (b.duration_sec || 0) - (a.duration_sec || 0))[0];
  const topH = hours.slice().sort((a, b) => (b.duration_sec || 0) - (a.duration_sec || 0))[0];
  const trendSeries = opts.trendSeries || [];
  const trendDays = Number(opts.trendDays) || 90;
  const selectedTotal = trendSeries.reduce((sum, d) => sum + (Number(d.duration_sec) || 0), 0);
  const half = Math.floor(trendSeries.length / 2);
  const firstHalf = trendSeries.slice(0, half).reduce((sum, d) => sum + (Number(d.duration_sec) || 0), 0);
  const secondHalf = trendSeries.slice(half).reduce((sum, d) => sum + (Number(d.duration_sec) || 0), 0);
  const paceWord = firstHalf > 0 && secondHalf > firstHalf * 1.15 ? 'up' : (firstHalf > 0 && secondHalf < firstHalf * 0.85 ? 'down' : 'steady');
  const last7 = k.last_7_days_time_sec || 0;
  const avg30 = k.avg_daily_time_30d_sec || 0;

  return {
    title: paceWord === 'up' ? t('Momentum is building') : paceWord === 'down' ? t('A slower reading week') : t('Your reading pace is steady'),
    body: [
      t('You logged %1 in the selected %2-day range.', formatDuration(selectedTotal), trendDays),
      topW ? t('%1 is your strongest reading day.', t(topW.weekday)) : t('No weekday pattern yet.'),
      topH && topH.duration_sec > 0 ? t('Most reading happens around %1:00.', String(topH.hour).padStart(2, '0')) : t('Read a few sessions to unlock hourly patterns.'),
      (s.current_streak_days || 0) > 0 ? t('Current streak: %1 days.', s.current_streak_days) : t('No current streak yet.'),
    ].join(' '),
    chips: [
      t('7d: %1', formatDuration(last7)),
      t('30d avg: %1', formatDuration(avg30)),
      t('Best streak: %1d', s.best_streak_days || 0),
    ]
  };
}

function getTrendSeriesByDays(series = {}, days = 90) {
  const all = []
    .concat(toArray(series.daily_365d))
    .concat(toArray(series.daily_180d))
    .concat(toArray(series.daily_90d));
  const seen = new Set();
  const deduped = [];
  for (const d of all) {
    const key = String(d?.date || '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(d);
  }
  if (!deduped.length) return [];
  deduped.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const take = Math.max(1, Number(days) || 90);
  return deduped.slice(-take);
}

function buildMonthlySeriesFromDaily(daily = []) {
  const m = new Map();
  for (const d of toArray(daily)) {
    const date = String(d?.date || '');
    if (!date) continue;
    const ym = date.slice(0, 7);
    const slot = m.get(ym) || { month: ym, duration_sec: 0, days_read: 0 };
    slot.duration_sec += Number(d.duration_sec) || 0;
    if ((Number(d.duration_sec) || 0) > 0) slot.days_read += 1;
    m.set(ym, slot);
  }
  return [...m.values()].sort((a, b) => String(a.month).localeCompare(String(b.month)));
}

function buildWeekdaySeriesFromDaily(daily = []) {
  const map = new Map([
    [1, { weekday: 'Mon', total: 0, days: 0 }],
    [2, { weekday: 'Tue', total: 0, days: 0 }],
    [3, { weekday: 'Wed', total: 0, days: 0 }],
    [4, { weekday: 'Thu', total: 0, days: 0 }],
    [5, { weekday: 'Fri', total: 0, days: 0 }],
    [6, { weekday: 'Sat', total: 0, days: 0 }],
    [0, { weekday: 'Sun', total: 0, days: 0 }],
  ]);
  for (const d of toArray(daily)) {
    const ds = String(d?.date || '');
    if (!ds) continue;
    const dt = new Date(`${ds}T00:00:00`);
    if (Number.isNaN(dt.getTime())) continue;
    const key = dt.getDay();
    const slot = map.get(key);
    if (!slot) continue;
    slot.total += Number(d.duration_sec) || 0;
    slot.days += 1;
  }
  return [1, 2, 3, 4, 5, 6, 0].map((k) => {
    const slot = map.get(k);
    return {
      weekday: slot.weekday,
      duration_sec: slot.days > 0 ? Math.floor(slot.total / slot.days) : 0,
    };
  });
}

function getHourlySeriesByDays(series = {}, days = 90) {
  if (days === 30) return series.hourly_activity_30d || [];
  if (days === 180) return series.hourly_activity_180d || [];
  if (days === 365) return series.hourly_activity_365d || [];
  return series.hourly_activity_90d || series.hourly_activity || [];
}

function getBooksTouchedByDays(kpis = {}, days = 90) {
  if (days === 30) return Number(kpis.books_touched_30d) || 0;
  if (days === 180) return Number(kpis.books_touched_180d) || 0;
  if (days === 365) return Number(kpis.books_touched_365d) || 0;
  return Number(kpis.books_touched_90d) || Number(kpis.books_touched_30d) || 0;
}

function getTopBooksByDays(topBooks = {}, kind = 'time', days = 90) {
  const suffix = days === 30 ? '30d' : days === 180 ? '180d' : days === 365 ? '365d' : '90d';
  const key = kind === 'pages' ? `by_pages_${suffix}` : `by_time_${suffix}`;
  const fallbackKey = kind === 'pages' ? 'by_pages' : 'by_time';
  const rows = toArray(topBooks[key]);
  return rows.length ? rows : (Array.isArray(topBooks[fallbackKey]) ? topBooks[fallbackKey] : []);
}

function getStreaksFromDailySeries(daily = []) {
  const sorted = toArray(daily).slice()
    .filter((d) => d && d.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    if ((Number(d.duration_sec) || 0) <= 0) continue;
    const cur = new Date(`${d.date}T00:00:00`);
    if (Number.isNaN(cur.getTime())) continue;
    if (!prev) run = 1;
    else {
      const diffDays = Math.round((cur - prev) / 86400000);
      run = diffDays === 1 ? run + 1 : 1;
    }
    prev = cur;
    if (run > best) best = run;
  }
  let current = 0;
  let expected = startOfDay(new Date());
  const activeSet = new Set(sorted.filter((d) => (Number(d.duration_sec) || 0) > 0).map((d) => String(d.date)));
  const todayStr = toDateStr(expected);
  if (!activeSet.has(todayStr)) expected = addDays(expected, -1);
  for (let i = 0; i < 500; i++) {
    const ds = toDateStr(expected);
    if (!activeSet.has(ds)) break;
    current += 1;
    expected = addDays(expected, -1);
  }
  return { best, current };
}

function buildTrendChart(data) {
  if (!data.length) return '<div class="empty-inline">No reading statistics available yet.</div>';
  const W = 900, H = 260, pad = { t: 18, r: 16, b: 30, l: 18 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const vals = data.map(d => Number(d.duration_sec) || 0);
  const max = Math.max(...vals, 1);
  const step = vals.length > 1 ? cw / (vals.length - 1) : cw;
  let line = '';
  let area = `M ${pad.l} ${pad.t + ch}`;
  let dots = '';
  let hoverLines = '';

  vals.forEach((v, i) => {
    const x = pad.l + i * step;
    const y = pad.t + ch - (v / max) * ch;
    line += `${i ? ' L ' : 'M '}${x.toFixed(1)} ${y.toFixed(1)}`;
    area += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    const d = data[i];
    const tip = esc(t('%1: %2 · %3 books', formatDateLabel(d.date), formatDurationLong(v), d.books_count || 0));
    hoverLines += `<line x1="${x.toFixed(1)}" y1="${pad.t}" x2="${x.toFixed(1)}" y2="${pad.t + ch}" class="trend-hitline" data-tip="${tip}"></line>`;
    hoverLines += `<line x1="${x.toFixed(1)}" y1="${pad.t}" x2="${x.toFixed(1)}" y2="${pad.t + ch}" class="trend-focusline"></line>`;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="trend-dot" data-tip="${tip}"></circle>`;
  });
  area += ` L ${pad.l + cw} ${pad.t + ch} Z`;

  const grid = [0.25, 0.5, 0.75, 1].map((t) => {
    const y = (pad.t + ch - ch * t).toFixed(1);
    return `<line x1="${pad.l}" y1="${y}" x2="${pad.l + cw}" y2="${y}" class="chart-grid"/>`;
  }).join('');

  const labelsStep = Math.max(1, Math.floor(data.length / 6));
  const labels = data.map((d, i) => {
    if (i % labelsStep !== 0 && i !== data.length - 1) return '';
    const x = (pad.l + i * step).toFixed(1);
    return `<text x="${x}" y="${H - 8}" text-anchor="middle" class="chart-label">${esc(d.date.slice(5))}</text>`;
  }).join('');

  return `
    <div class="chart-card trend-card">
      <svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="none">
        ${grid}
        <path d="${area}" class="trend-area"></path>
        <path d="${line}" class="trend-line"></path>
        ${hoverLines}
        ${dots}
        ${labels}
      </svg>
      <div class="trend-summary-row">
        <div class="stat-mini"><span>Total</span><strong>${formatDuration(data.reduce((s, d) => s + (d.duration_sec || 0), 0))}</strong></div>
        <div class="stat-mini"><span>Active days</span><strong>${data.filter(d => (d.duration_sec || 0) > 0).length}</strong></div>
        <div class="stat-mini"><span>Best day</span><strong>${formatDuration(Math.max(...vals, 0))}</strong></div>
      </div>
    </div>`;
}

function buildBarChart(data, opts = {}) {
  if (!data.length) return '<div class="empty-inline">No data yet.</div>';
  const max = Math.max(...data.map(d => d.value || 0), 1);
  const fmt = opts.valueFormatter || ((v) => String(v));
  const maxIdx = data.reduce((mi, d, i, arr) => ((d.value || 0) > (arr[mi]?.value || 0) ? i : mi), 0);
  const chartClass = opts.chartClass ? ` ${opts.chartClass}` : '';
  return `
    <div class="bars-wrap${chartClass}">
      ${data.map((d, i) => {
        const pct = ((d.value || 0) / max) * 100;
        return `
          <div class="bar-col" data-tip="${esc(d.tip || t('%1: %2', d.label, fmt(d.value || 0)))}">
            <div class="bar-track"><div class="bar-fill ${opts.highlightMax && i === maxIdx ? 'hot' : ''}" style="height:${Math.max(pct, d.value > 0 ? 4 : 0)}%"></div></div>
            <div class="bar-label">${esc(d.label)}</div>
            <div class="bar-value">${esc(fmt(d.value || 0))}</div>
          </div>`;
      }).join('')}
    </div>`;
}

function buildHourChart(data) {
  if (!data.length) return '<div class="empty-inline">No hourly activity yet.</div>';
  const LOW_CAPSULE_THRESHOLD_PCT = 18;
  const max = Math.max(...data.map(d => d.duration_sec || 0), 1);
  return `
    <div class="hour-grid">
      ${data.map((d) => {
        const value = Number(d.duration_sec) || 0;
        const pct = (value / max) * 100;
        const isEmpty = value <= 0;
        const isLowCapsule = !isEmpty && pct < LOW_CAPSULE_THRESHOLD_PCT;
        const fill = isEmpty
          ? ''
          : `<div class="hour-fill${isLowCapsule ? ' low' : ''}"${isLowCapsule ? '' : ` style="height:${Math.max(14, pct)}%"`}></div>`;
        return `
          <div class="hour-cell ${isEmpty ? 'is-empty' : ''}" data-tip="${esc(t('%1:00 · %2 · %3 sessions', String(d.hour).padStart(2, '0'), formatDurationLong(d.duration_sec || 0), d.sessions || 0))}">
            <div class="hour-pill">${fill}</div>
            <div class="hour-label">${String(d.hour).padStart(2, '0')}</div>
          </div>`;
      }).join('')}
    </div>`;
}

function buildTopBooksList(items, metricKey) {
  if (!items.length) return '<div class="empty-inline">No ranked books yet.</div>';
  const max = Math.max(...items.map(i => Number(i[metricKey]) || 0), 1);
  return `
    <div class="rank-list">
      ${items.map((b, idx) => {
        const metric = Number(b[metricKey]) || 0;
        const label = metricKey === 'total_read_pages' ? t('%1 pages', fmtNumber(metric)) : formatDuration(metric);
        return `
          <div class="rank-item" data-tip="${esc(b.title || '')}: ${esc(label)}">
            <div class="rank-num">${idx + 1}</div>
            <div class="rank-cover">${renderBookCover(b, { variant: 'thumb' })}</div>
            <div class="rank-main">
              <div class="rank-title">${esc(b.title || 'Untitled')}</div>
              <div class="rank-sub">${esc(b.authors || 'Unknown author')}</div>
              <div class="rank-meter"><div style="width:${(metric / max) * 100}%"></div></div>
            </div>
            <div class="rank-value">${esc(label)}</div>
          </div>`;
      }).join('')}
    </div>`;
}

/* ============================================================
   Calendar page
   ============================================================ */
async function renderCalendar() {
  const calToken = renderToken;
  const [dash, booksResp] = await Promise.all([
    getDashboard(),
    api('books').catch(() => ({ books: [] })),
  ]);
  const allBooks = dedupeBooksForDisplay(toArray(booksResp.books));
  const coverResolver = buildLibraryCoverResolver(allBooks);
  const dayMap = {};
  const days = toArray(dash && dash.calendar && dash.calendar.days);
  for (let i = 0; i < days.length; i += 1) {
    const d = days[i] || {};
    if (!d.date) continue;
    dayMap[d.date] = {
      ...d,
      top_books: toArray(d.top_books).map(coverResolver),
    };
  }
  if (calToken !== renderToken) return; // stale render
  renderCalendarView(dash, dayMap, coverResolver);
}

function renderCalendarView(dash, dayMap, coverResolver, opts = {}) {
  const preserveScroll = !!opts.preserveScroll;
  const prevScrollTop = preserveScroll ? (window.scrollY || window.pageYOffset || 0) : 0;
  const d = state.calendarDate;
  const year = d.getFullYear();
  const month = d.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const label = monthStart.toLocaleDateString(UI_LOCALE, { month: 'long', year: 'numeric' });

  const calStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7));
  const calEnd = addDays(monthEnd, 6 - ((monthEnd.getDay() + 6) % 7));
  const todayStr = toDateStr(startOfDay(new Date()));

  const max90 = dash.calendar?.legend?.max_daily_sec_90d || 1;
  let monthReadDays = 0, monthDuration = 0;
  for (let cur = new Date(monthStart); cur <= monthEnd; cur = addDays(cur, 1)) {
    const ds = toDateStr(cur);
    const info = dayMap[ds];
    if (info?.duration_sec > 0) {
      monthReadDays++;
      monthDuration += info.duration_sec || 0;
    }
  }

  if (!state.calendarSelectedDate) {
    state.calendarSelectedDate = dayMap[todayStr]?.duration_sec ? todayStr : null;
  }

  let cur = new Date(calStart);
  let daysHTML = '';
  while (cur <= calEnd) {
    const ds = toDateStr(cur);
    const info = dayMap[ds] || { duration_sec: 0, top_books: [], books_count: 0 };
    const inMonth = cur.getMonth() === month;
    const isToday = ds === todayStr;
    const selected = ds === state.calendarSelectedDate;
    const intensity = Math.min(1, (info.duration_sec || 0) / max90);
    const cls = ['calendar-cell', inMonth ? '' : 'muted', isToday ? 'today' : '', selected ? 'selected' : '', info.duration_sec > 0 ? 'active-day' : ''].filter(Boolean).join(' ');
    const bgStyle = `--heat:${intensity.toFixed(3)}`;
    daysHTML += `
      <button class="${cls}" style="${bgStyle}" data-day="${ds}" type="button">
        <div class="calendar-cell-head">
          <span class="day-num">${cur.getDate()}</span>
          ${info.duration_sec > 0 ? `<span class="day-time">${esc(formatDuration(info.duration_sec))}</span>` : ''}
        </div>
        <div class="calendar-book-stack">
          ${(info.top_books || []).slice(0, window.innerWidth <= 768 ? 2 : 3).map((b) => `
            <div class="calendar-book-thumb" data-tip="${esc(t('%1 · %2', b.title || t('Untitled'), formatDurationLong(b.duration_sec || 0)))}">
              ${renderBookCover(b, { variant: 'thumb' })}
            </div>`).join('')}
        </div>
      </button>`;
    cur = addDays(cur, 1);
  }

  const monthPills = [-1, 0, 1, 2].map((offset) => {
    const md = new Date(year, month + offset, 1);
    const active = offset === 0;
    return `<button class="month-pill ${active ? 'active' : ''}" data-month-offset="${offset}" type="button">${esc(md.toLocaleDateString(UI_LOCALE, { month: 'short' }))}</button>`;
  }).join('');

  const selectedDay = state.calendarSelectedDate ? dayMap[state.calendarSelectedDate] : null;

  $content.innerHTML = `
    <div class="calendar-view">
      <section class="panel calendar-hero">
        <div class="calendar-hero-head">
          <div>
            <div class="section-kicker">Reading streak</div>
            <h1>${dash.summary?.best_streak_days || 0}<span> days best</span></h1>
            <p>${esc(t('Current streak %1 days · Last read %2', dash.summary?.current_streak_days || 0, dash.summary?.last_read_date ? formatDateLabel(dash.summary.last_read_date) : '—'))}</p>
          </div>
          <div class="calendar-hero-stats">
            <div class="mini-stat"><span>Month read days</span><strong>${monthReadDays}</strong></div>
            <div class="mini-stat"><span>Month time</span><strong>${formatDuration(monthDuration)}</strong></div>
          </div>
        </div>
        <div class="calendar-month-switcher">
          <div class="month-pill-group">${monthPills}</div>
          <div class="calendar-nav-right">
            <button class="ghost-btn" id="prevMonthBtn" type="button">${icon('prev', 14)}</button>
            <div class="calendar-month-title">${esc(label)}</div>
            <button class="ghost-btn" id="nextMonthBtn" type="button">${icon('next', 14)}</button>
            <button class="ghost-btn" id="todayBtn" type="button">Today</button>
          </div>
        </div>
      </section>

      <section class="calendar-layout">
        <article class="panel calendar-grid-panel">
          <div class="calendar-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(w => `<div>${w}</div>`).join('')}</div>
          <div class="calendar-grid">${daysHTML}</div>
        </article>

        <aside class="panel calendar-side-panel">
          <div class="section-head">
            <div><div class="section-kicker">Day details</div><h2 id="calendarDayTitle">${selectedDay ? esc(formatDateLabel(state.calendarSelectedDate)) : 'Select a day'}</h2></div>
          </div>
          <div id="calendarDayDetailBody">${selectedDay ? buildCalendarDayDetail(selectedDay, coverResolver) : '<div class="empty-inline">Tap a day with reading to inspect top books and duration.</div>'}</div>
        </aside>
      </section>
    </div>`;

  if (preserveScroll) window.scrollTo(0, prevScrollTop);

  document.querySelectorAll('[data-day]').forEach((btn) => btn.addEventListener('click', () => {
    state.calendarSelectedDate = btn.dataset.day;
    updateCalendarDaySelectionUI(dayMap);
  }));
  document.querySelectorAll('[data-month-offset]').forEach((btn) => btn.addEventListener('click', () => {
    const offset = Number(btn.dataset.monthOffset) || 0;
    state.calendarDate = new Date(year, month + offset, 1);
    renderCalendarView(dash, dayMap, coverResolver, { preserveScroll: true });
  }));
  document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    state.calendarDate = new Date(year, month - 1, 1);
    renderCalendarView(dash, dayMap, coverResolver, { preserveScroll: true });
  });
  document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    state.calendarDate = new Date(year, month + 1, 1);
    renderCalendarView(dash, dayMap, coverResolver, { preserveScroll: true });
  });
  document.getElementById('todayBtn')?.addEventListener('click', () => {
    state.calendarDate = new Date();
    state.calendarSelectedDate = toDateStr(startOfDay(new Date()));
    renderCalendarView(dash, dayMap, coverResolver, { preserveScroll: true });
  });

  bindTooltips($content);
}

function updateCalendarDaySelectionUI(dayMap) {
  const selectedDate = state.calendarSelectedDate || '';
  document.querySelectorAll('.calendar-grid [data-day]').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.day === selectedDate);
  });
  const titleEl = document.getElementById('calendarDayTitle');
  const bodyEl = document.getElementById('calendarDayDetailBody');
  const selectedDay = selectedDate ? dayMap[selectedDate] : null;
  if (titleEl) titleEl.textContent = selectedDay ? formatDateLabel(selectedDate) : t('Select a day');
  if (bodyEl) {
    bodyEl.innerHTML = selectedDay
      ? buildCalendarDayDetail(selectedDay)
      : '<div class="empty-inline">Tap a day with reading to inspect top books and duration.</div>';
  }
}

function buildCalendarDayDetail(day) {
  const top = toArray(day.top_books);
  return `
    <div class="calendar-day-detail">
      <div class="day-detail-summary">
        <div><span>Total reading</span><strong>${formatDuration(day.duration_sec || 0)}</strong></div>
        <div><span>Books</span><strong>${day.books_count || top.length || 0}</strong></div>
      </div>
      <div class="calendar-detail-list">
        ${top.length ? top.map((b, i) => `
          <div class="calendar-detail-item">
            <div class="calendar-detail-rank">${i + 1}</div>
            <div class="calendar-detail-cover">${renderBookCover(b, { variant: 'thumb' })}</div>
            <div class="calendar-detail-main">
              <div class="calendar-detail-title">${esc(b.title || 'Untitled')}</div>
              <div class="calendar-detail-sub">${esc(b.authors || 'Unknown author')}</div>
            </div>
            <div class="calendar-detail-time">${esc(formatDuration(b.duration_sec || 0))}</div>
          </div>`).join('') : '<div class="empty-inline">No book breakdown available.</div>'}
      </div>
    </div>`;
}

/* GitHub-style reading history dot trail (like KoInsight's Reading history):
   a column-per-week grid ending today, teal intensity by max daily reading
   time, hover tooltips. Reuses the .book-heat-* cell styles. */
function buildReadingHistoryHeatmap(daily = []) {
  daily = toArray(daily);
  if (!daily.length) {
    return '<article class="panel stats-history-panel"><div class="section-head"><div><div class="section-kicker">' + t('Reading history') + '</div><h2>' + t('Daily heatmap') + '</h2></div></div><div class="empty-inline">' + t('No reading statistics available yet.') + '</div></article>';
  }
  const dayMap = new Map();
  let maxDur = 0;
  for (const d of daily) {
    const ds = String(d?.date || '');
    const dur = Number(d.duration_sec) || 0;
    if (ds) dayMap.set(ds, dur);
    if (dur > maxDur) maxDur = dur;
  }
  const today = startOfDay(new Date());
  const weeks = window.innerWidth <= 768 ? 26 : 52;
  const gridStart = addDays(today, -(weeks * 7 - 1));
  const monday = addDays(gridStart, -((gridStart.getDay() + 6) % 7)); // weeks start Monday
  const todayStr = toDateStr(today);
  let active = 0;
  let total = 0;
  const cells = [];
  for (let d = new Date(monday); d <= today; d = addDays(d, 1)) {
    const ds = toDateStr(d);
    const dur = dayMap.get(ds) || 0;
    if (dur > 0) { active += 1; total += dur; }
    const intensity = maxDur > 0 ? (dur / maxDur) : 0;
    const tip = `${ds} · ${dur > 0 ? formatDurationLong(dur) : t('No reading')}`;
    const cls = ['book-heat-cell', dur > 0 ? 'active' : '', ds === todayStr ? 'today' : ''].filter(Boolean).join(' ');
    cells.push(`<div class="${cls}" style="--heat:${intensity.toFixed(3)}" data-tip="${esc(tip)}"></div>`);
  }
  return `
    <article class="panel book-heat-panel stats-history-panel">
      <div class="section-head">
        <div>
          <div class="section-kicker">${t('Reading history')}</div>
          <h2>${t('Daily heatmap')}</h2>
        </div>
        <div class="section-note">${esc(t(weeks <= 26 ? 'Last 6 months · %1 active days · %2' : 'Last 12 months · %1 active days · %2', fmtNumber(active), formatDuration(total)))}</div>
      </div>
      <div class="book-heat-shell panel-subtle">
        <div class="book-heat-grid year-heat-grid">${cells.join('')}</div>
      </div>
    </article>`;
}

function buildBookDailyHeatmap(rows = [], annotations = []) {
  const dayMap = new Map();
  for (const s of toArray(rows)) {
    const key = String(s?.date || '');
    if (!key) continue;
    const isDailyAgg = Number.isFinite(Number(s?.duration_sec));
    const slot = dayMap.get(key) || { date: key, duration: 0, sessions: 0, pages: new Set(), pagesCount: 0 };
    if (isDailyAgg) {
      slot.duration += Number(s?.duration_sec) || 0;
      slot.sessions += Number(s?.sessions) || 0;
      slot.pagesCount += Number(s?.pages) || 0;
    } else {
      slot.duration += Number(s?.duration) || 0;
      slot.sessions += 1;
      if (Number.isFinite(Number(s?.page)) && Number(s?.page) > 0) slot.pages.add(Number(s.page));
    }
    dayMap.set(key, slot);
  }
  for (const a of toArray(annotations)) {
    const d = parseDateLike(a?.datetime || a?.datetime_updated);
    const key = d ? toDateStr(startOfDay(d)) : '';
    if (!key) continue;
    const slot = dayMap.get(key) || { date: key, duration: 0, sessions: 0, pages: new Set(), pagesCount: 0, annotations: 0 };
    slot.annotations = (slot.annotations || 0) + 1;
    dayMap.set(key, slot);
  }
  const today = startOfDay(new Date());
  const start = addDays(today, -83);
  const startDow = (start.getDay() + 6) % 7; // Monday=0
  const gridStart = addDays(start, -startDow);
  const gridDays = [];
  const weeks = 13;
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(gridStart, i);
    const ds = toDateStr(d);
    const slot = dayMap.get(ds);
    gridDays.push({
      date: ds,
      inRange: d >= start && d <= today,
      isToday: toDateStr(today) === ds,
      weekday: (d.getDay() + 6) % 7,
      duration: slot ? slot.duration : 0,
      sessions: slot ? slot.sessions : 0,
      pages: slot ? ((slot.pages && slot.pages.size) || slot.pagesCount || 0) : 0,
      annotations: slot ? (slot.annotations || 0) : 0,
    });
  }
  const maxDuration = Math.max(0, ...gridDays.map((d) => d.duration || 0));
  const activeDays = gridDays.filter((d) => d.inRange && (d.duration > 0 || d.annotations > 0)).length;
  const totalDuration = gridDays.reduce((sum, d) => sum + (d.inRange ? (d.duration || 0) : 0), 0);

  const cells = gridDays.map((d, i) => {
    const intensity = maxDuration > 0 ? (d.duration / maxDuration) : 0;
    const hasReadingStats = d.duration > 0;
    const tip = `${d.date} · ${hasReadingStats ? formatDurationLong(d.duration) : (d.annotations ? t('No reading stats') : t('No reading'))}${d.sessions ? ` · ${t('%1 sessions', d.sessions)}` : ''}${d.pages ? ` · ${t('%1 pages touched', d.pages)}` : ''}${d.annotations ? ` · ${t('%1 annotations', d.annotations)}` : ''}`;
    const week = Math.floor(i / 7) + 1;
    const row = (d.weekday || 0) + 1;
    const isActive = d.duration > 0 || d.annotations > 0;
    const annOnly = d.annotations > 0 && d.duration <= 0;
    return `<div class="book-heat-cell ${d.inRange ? '' : 'out'} ${isActive ? 'active' : ''} ${annOnly ? 'annotation-only' : ''} ${d.isToday ? 'today' : ''}" style="--heat:${intensity.toFixed(3)}; grid-column:${week}; grid-row:${row};" data-tip="${esc(tip)}"></div>`;
  }).join('');

  return `
    <section class="panel book-heat-panel">
      <div class="section-head">
        <div>
          <div class="section-kicker">Reading Rhythm</div>
          <h2>Daily heatmap</h2>
        </div>
        <div class="section-note">${esc(t('Last 12 weeks · %1 active days · %2', fmtNumber(activeDays), formatDuration(totalDuration)))}</div>
      </div>
      <div class="book-heat-shell panel-subtle">
        <div class="book-heat-grid">${cells}</div>
      </div>
    </section>`;
}

/* ============================================================
   Cloud sync page
   ============================================================ */
let cloudPollTimer = null;
function clearCloudPoll() {
  if (cloudPollTimer) {
    clearInterval(cloudPollTimer);
    cloudPollTimer = null;
  }
}

function cloudStatusBadge(status) {
  if (!status || !status.available) return `<span class="status-badge queued">${t('Cloud sync unavailable')}</span>`;
  if (status.busy) return `<span class="status-badge reading">${t('Running')}</span>`;
  if (!status.configured) return `<span class="status-badge queued">${t('Not configured')}</span>`;
  return `<span class="status-badge finished">${t('Configured')}</span>`;
}

function updateCloudActivityUI(act) {
  if (!act) return;
  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  setText('cloudCount', `${t((act.kind) || 'annotations')} · ${fmtNumber(act.done || 0)} / ${fmtNumber(act.total || 0)}`);
  setText('cloudOk', fmtNumber(act.ok || 0));
  setText('cloudSkip', fmtNumber(act.skipped || 0));
  setText('cloudFail', fmtNumber(act.failed || 0));
  setText('cloudCurrent', act.current || '');
  setText('cloudState', act.running ? t('Running') : t('Finished'));
  const fill = document.getElementById('cloudBarFill');
  if (fill) {
    const pct = act.total > 0 ? Math.round(((act.done || 0) / act.total) * 100) : 0;
    fill.style.width = pct + '%';
  }
  const errBox = document.getElementById('cloudErrors');
  if (errBox) {
    const errs = toArray(act.errors);
    errBox.innerHTML = errs.length ? errs.map((e) => `<div>${esc(e)}</div>`).join('') : '';
  }
  if (act.running) pollCloudActivity();
}

function pollCloudActivity() {
  clearCloudPoll();
  cloudPollTimer = setInterval(async () => {
    const act = await apiNoCache('cloud/activity').catch(() => null);
    if (!act) return;
    updateCloudActivityUI(act);
    if (!act.running) clearCloudPoll(); // stop once the job is done
  }, 1200);
}

async function startCloudSync() {
  const btn = document.getElementById('cloudSyncBtn');
  if (btn) btn.disabled = true;
  try {
    const res = await apiNoCachePost('cloud/annotations/sync');
    if (res && res.ok === false && res.busy) {
      pollCloudActivity();
    } else {
      renderCloud();
      pollCloudActivity();
    }
  } catch (e) {
    if (btn) btn.disabled = false;
    window.alert(t('Cloud sync failed: %1', e && e.message ? e.message : String(e)));
  }
}

async function startCloudCover(kind) {
  const btn = kind === 'restore' ? document.getElementById('cloudRestoreBtn') : document.getElementById('cloudBackupBtn');
  if (btn) btn.disabled = true;
  try {
    await apiNoCachePost(kind === 'restore' ? 'cloud/covers/restore' : 'cloud/covers/backup');
    renderCloud();
    pollCloudActivity();
  } catch (e) {
    if (btn) btn.disabled = false;
    window.alert(t('Cloud sync failed: %1', e && e.message ? e.message : String(e)));
  }
}

async function startCloudProgress() {
  const btn = document.getElementById('cloudProgressBtn');
  if (btn) btn.disabled = true;
  try {
    await apiNoCachePost('cloud/progress/sync');
    renderCloud();
    pollCloudActivity();
  } catch (e) {
    if (btn) btn.disabled = false;
    window.alert(t('Cloud sync failed: %1', e && e.message ? e.message : String(e)));
  }
}

// Sync the most recently opened book on this device ("current book").
async function startCloudCurrent(channel) {
  const id = channel === 'progress' ? 'cloudProgressCurrentBtn' : 'cloudCurrentBtn';
  const btn = document.getElementById(id);
  if (btn) btn.disabled = true;
  try {
    const res = await apiNoCachePost('cloud/' + channel + '/current');
    if (res && res.ok === false && res.error === 'no book to sync') {
      window.alert(t('No recent book to sync'));
    }
    renderCloud();
    pollCloudActivity();
  } catch (e) {
    if (btn) btn.disabled = false;
    window.alert(t('Cloud sync failed: %1', e && e.message ? e.message : String(e)));
  }
}

async function setCloudConflict(value) {
  try {
    await apiNoCachePost('cloud/progress/conflict', { value });
    renderCloud();
  } catch (e) {
    window.alert(t('Cloud sync failed: %1', e && e.message ? e.message : String(e)));
  }
}

async function toggleCloudAuto(channel, key, on) {
  try {
    await apiNoCachePost('cloud/settings/auto', { channel, key, on });
    renderCloud();
  } catch (e) {
    window.alert(t('Cloud sync failed: %1', e && e.message ? e.message : String(e)));
  }
}

async function renderCloud() {
  clearCloudPoll();
  const cloudToken = renderToken;
  const status = await apiNoCache('cloud/status').catch(() => null);
  const act = await apiNoCache('cloud/activity').catch(() => ({}));

  const autoFlags = (status && status.auto) || {};
  const autoChips = [
    [autoFlags.open, 'on book open'],
    [autoFlags.close, 'on book close'],
    [autoFlags.resume, 'on resume'],
  ].map(([on, key]) =>
    `<span class="insight-chip">${on ? '● ' : '○ '}${t(key)}</span>`
  ).join('');

  $content.innerHTML = `
    <div class="view-fade cloud-view">
      <section class="hero-shell compact">
        <div class="hero-copy">
          <div class="eyebrow">${t('Cloud sync')}</div>
          <h1 class="hero-title">${t('Your annotations, in the cloud.')}</h1>
          <p class="hero-sub">${t('Push and pull highlights and notes with your WebDAV or Dropbox.')}</p>
        </div>
        <div class="hero-grid">
          <article class="hero-card panel">
            <div class="hero-card-head"><span>${t('Cloud storage')}</span>${cloudStatusBadge(status)}</div>
            <div class="hero-card-value hero-card-value-display">${status && status.name ? esc(status.name) : t('Not configured')}</div>
            <div class="hero-card-sub">${status && status.path ? esc(status.path) : ''}</div>
          </article>
          <article class="hero-card panel">
            <div class="hero-card-head"><span>${t('Auto-sync')}</span></div>
            <div class="cloud-auto-chips">${autoChips || ''}</div>
          </article>
        </div>
      </section>

      <section class="stats-layout">
        <article class="panel cloud-actions-panel">
          <div class="section-head">
            <div><div class="section-kicker">${t('Annotations')}</div><h2>${t('Annotations')}</h2></div>
          </div>
          <div class="cloud-actions">
            <div class="cloud-actions-row">
              <button class="ghost-btn" id="cloudCurrentBtn" ${(status && status.configured && !(status && status.busy)) ? '' : 'disabled'} title="${t('Sync current book')}">${icon('cloud', 14)} ${t('Sync current book')}</button>
              <button class="ghost-btn" id="cloudSyncBtn" ${(status && status.configured && !(status && status.busy)) ? '' : 'disabled'} title="${t('Sync all books')}">${icon('cloud', 14)} ${t('Sync all books')}</button>
            </div>
            <div class="cloud-actions-row">
              <span class="section-note" style="margin:0">${t('Auto-sync')}:</span>
              ${['open', 'close', 'resume'].map((k) => `<button class="pill month-pill ${(status && status.auto && status.auto[k]) ? 'active' : ''}" type="button" data-cloud-auto="${k}" data-channel="annotations">${t(k === 'open' ? 'on book open' : k === 'close' ? 'on book close' : 'on resume')}</button>`).join('')}
            </div>
            <div class="cloud-actions-row">
              <span class="section-note" style="margin:0">${t('Covers')}:</span>
              <button class="ghost-btn" id="cloudBackupBtn" ${(status && status.configured && !(status && status.busy)) ? '' : 'disabled'}>${icon('cloud', 14)} ${t('Backup covers')}</button>
              <button class="ghost-btn" id="cloudRestoreBtn" ${(status && status.configured && !(status && status.busy)) ? '' : 'disabled'}>${icon('cloud', 14)} ${t('Restore covers')}</button>
            </div>
            <p class="section-note">${status && !status.configured && status.available ? t('Configure in KOReader menu: Tools → KoCloud → Cloud sync.') : ''}</p>
            ${status && !status.available ? `<p class="section-note">${esc((status && status.reason) || t('Cloud sync unavailable'))}</p>` : ''}
          </div>
        </article>

        <article class="panel cloud-actions-panel">
          <div class="section-head">
            <div><div class="section-kicker">${t('Progress sync')}</div><h2>${t('Progress sync')}</h2></div>
          </div>
          <div class="cloud-actions">
            <div class="cloud-actions-row">
              <button class="ghost-btn" id="cloudProgressCurrentBtn" ${(status && status.available && status.progress && status.progress.configured && !(status && status.busy)) ? '' : 'disabled'} title="${t('Sync current book')}">${icon('cloud', 14)} ${t('Sync current book')}</button>
              <button class="ghost-btn" id="cloudProgressBtn" ${(status && status.available && status.progress && status.progress.configured && !(status && status.busy)) ? '' : 'disabled'} title="${t('Sync all books')}">${icon('cloud', 14)} ${t('Sync all books')}</button>
            </div>
            <div class="cloud-actions-row">
              <span class="section-note" style="margin:0">${t('On conflict')}:</span>
              <button class="pill month-pill ${status && status.progress && status.progress.conflict !== 'earlier' ? 'active' : ''}" type="button" data-conflict="later">${t('Use later progress')}</button>
              <button class="pill month-pill ${status && status.progress && status.progress.conflict === 'earlier' ? 'active' : ''}" type="button" data-conflict="earlier">${t('Use earlier progress')}</button>
            </div>
            <div class="cloud-actions-row">
              <span class="section-note" style="margin:0">${t('Auto-sync')}:</span>
              ${['open', 'close', 'resume'].map((k) => `<button class="pill month-pill ${(status && status.progress && status.progress.auto && status.progress.auto[k]) ? 'active' : ''}" type="button" data-cloud-auto="${k}" data-channel="progress">${t(k === 'open' ? 'on book open' : k === 'close' ? 'on book close' : 'on resume')}</button>`).join('')}
            </div>
            <p class="section-note">${status && status.progress && status.progress.configured
              ? (status.progress.name ? esc(status.progress.name) : '') + (status.progress.path ? ' · ' + esc(status.progress.path) : '')
              : ''}</p>
            <p class="section-note">${status && !status.progress.configured ? t('Configure in KOReader menu: Tools → KoCloud → Progress sync.') : ''}</p>
          </div>
        </article>

        <article class="panel cloud-activity-panel">
          <div class="section-head">
            <div><div class="section-kicker">${t('Activity')}</div><h2 id="cloudState">${act && act.running ? t('Running') : t('Finished')}</h2></div>
            <div class="section-note" id="cloudCount">${t((act && act.kind) || 'annotations')} · ${fmtNumber(act && act.done || 0)} / ${fmtNumber(act && act.total || 0)}</div>
          </div>
          <div class="cover-pull-progress"><div id="cloudBarFill" style="width:${act && act.total ? Math.round(((act.done || 0) / act.total) * 100) : 0}%"></div></div>
          <div class="cover-pull-meta">
            <span>${t('ok')}: <strong id="cloudOk">${fmtNumber(act && act.ok || 0)}</strong></span>
            <span>${t('skipped')}: <strong id="cloudSkip">${fmtNumber(act && act.skipped || 0)}</strong></span>
            <span>${t('failed')}: <strong id="cloudFail">${fmtNumber(act && act.failed || 0)}</strong></span>
          </div>
          <div class="section-note">${t('Current book')}: <span id="cloudCurrent">${esc((act && act.current) || '')}</span></div>
          <div class="cover-pull-errors" id="cloudErrors">${toArray(act && act.errors).map((e) => `<div>${esc(e)}</div>`).join('')}</div>
          ${act && (act.started_at || act.finished_at) ? `<div class="section-note">${t('Last sync')}: ${formatSyncTime(act.finished_at || act.started_at)}</div>` : `<div class="empty-inline">${t('No sync job yet')}</div>`}
        </article>
      </section>
    </div>`;

  if (cloudToken !== renderToken) return; // stale render (still poll if started)
  document.getElementById('cloudCurrentBtn')?.addEventListener('click', () => startCloudCurrent('annotations'));
  document.getElementById('cloudSyncBtn')?.addEventListener('click', startCloudSync);
  document.getElementById('cloudBackupBtn')?.addEventListener('click', () => startCloudCover('backup'));
  document.getElementById('cloudRestoreBtn')?.addEventListener('click', () => startCloudCover('restore'));
  document.getElementById('cloudProgressCurrentBtn')?.addEventListener('click', () => startCloudCurrent('progress'));
  document.getElementById('cloudProgressBtn')?.addEventListener('click', startCloudProgress);
  document.querySelectorAll('[data-conflict]').forEach((b) => b.addEventListener('click', () => setCloudConflict(b.dataset.conflict)));
  document.querySelectorAll('[data-cloud-auto]').forEach((b) => b.addEventListener('click', () => {
    const on = !b.classList.contains('active');
    toggleCloudAuto(b.dataset.channel, b.dataset.cloudAuto, on);
  }));
  bindTooltips($content);
  if (act && act.running) pollCloudActivity();
}

function formatSyncTime(epochSec) {
  if (!epochSec) return '—';
  const d = new Date(Number(epochSec) * 1000);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(UI_LOCALE);
}

/* ============================================================
   Book detail page
   ============================================================ */
async function renderBook() {
  const bookToken = renderToken;
  const currentBookRef = getBookRef(state.bookId);
  const [book, annResp, statsResp, timelineResp] = await Promise.all([
    api(`books/${encBookRef(currentBookRef)}`),
    api(`books/${encBookRef(currentBookRef)}/annotations`).catch(() => ({ annotations: [] })),
    api('stats').catch(() => ({ books: [] })),
    api(`books/${encBookRef(currentBookRef)}/timeline`).catch(() => ({ sessions: [], total: 0 })),
  ]);

  if (!book || book.error) {
    $content.innerHTML = '<section class="panel empty-panel"><h2>Book not found</h2></section>';
    return;
  }

  const annotations = dedupeAnnotationsForDisplay(toArray(annResp && annResp.annotations));
  const timeline = toArray(timelineResp && timelineResp.sessions);
  const timelineDaily = toArray(timelineResp && timelineResp.daily);
  const statsBooks = toArray(statsResp.books);
  const statsIndexes = buildStatsIndexes(statsBooks);
  book.cover_url = bookCoverUrl(currentBookRef);
  const bStats = findBestStatsMatch(book, statsBooks, statsIndexes) || {};
  const pagesRead = book.pages ? Math.round((book.percent / 100) * book.pages) : 0;
  const pct = Math.round(book.percent || 0);
  const statusTag = getBookStatusTag(book);
  if (bookToken !== renderToken) return; // stale render
  $content.innerHTML = `
    <div class="view-fade">
      <button class="ghost-btn back-btn" id="backBtn">${icon('back', 14)} Back to library</button>

      <section class="panel book-detail-hero">
        <div class="book-detail-cover-col">${renderBookCover(book, { variant: 'hero' })}</div>
        <div class="book-detail-meta-col">
          <div class="book-detail-top">
            <span class="status-badge ${statusTag}">${esc(statusTag)}</span>
            <span class="meta-dim">${book.last_open_ts ? esc(formatRelativeDate(book.last_open_ts)) : ''}</span>
          </div>
          <h1 class="book-detail-title">${esc(book.title || 'Untitled')}</h1>
          <p class="book-detail-author">${esc(book.authors || 'Unknown author')}</p>
          <div class="book-detail-tags">
            ${book.language ? `<span class="soft-tag">${esc(book.language)}</span>` : ''}
            ${book.pages ? `<span class="soft-tag">${t('%1 pages', fmtNumber(book.pages))}</span>` : ''}
            <span class="soft-tag">${t('%1% complete', pct)}</span>
          </div>
          <div class="book-progress large"><div class="book-progress-fill" style="width:${pct}%"></div></div>
          <div class="detail-metrics-grid">
            ${buildDetailMetric('Read time', formatDuration(bStats.total_read_time || 0), 'clock')}
            ${buildDetailMetric('Pages read', `${fmtNumber(pagesRead)} / ${fmtNumber(book.pages || 0)}`, 'page')}
            ${buildDetailMetric('Highlights', fmtNumber(book.highlights || 0), 'highlight')}
            ${buildDetailMetric('Notes', fmtNumber(book.notes || 0), 'note')}
          </div>
        </div>
      </section>

      <div class="book-detail-duo">
        ${buildBookDailyHeatmap(timelineDaily.length ? timelineDaily : timeline, annotations)}

        <section class="panel annotations-panel">
          <div class="section-head">
            <div>
              <div class="section-kicker">Timeline</div>
              <h2>Reading milestones</h2>
            </div>
          </div>
          ${buildBookMilestones({
            sessions: timeline,
            annotations,
            totalSessions: timelineResp.total || timeline.length,
            firstSession: timelineResp.first_session || null,
            lastSession: timelineResp.last_session || null,
          })}
        </section>
      </div>

      <section class="panel annotations-panel">
        <div class="section-head">
          <div><div class="section-kicker">Annotations</div><h2>${t('%1 items', fmtNumber(annotations.length))}</h2></div>
          <div class="search-box compact">
            <span class="ic">${icon('search', 15)}</span>
            <input id="annSearch" type="text" placeholder="Search annotations">
          </div>
        </div>
        <div class="annotations-list">
          ${annotations.length ? annotations.map(a => buildAnnotationCard(a)).join('') : '<div class="empty-inline">No annotations for this book.</div>'}
        </div>
      </section>
    </div>`;

  document.getElementById('backBtn')?.addEventListener('click', () => navigate('books'));
  document.getElementById('annSearch')?.addEventListener('input', (e) => {
    const q = (e.target.value || '').toLowerCase();
    debounceRun('annSearch', () => {
      document.querySelectorAll('.annotation-card').forEach((card) => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }, 160);
  });
  bindAnnotationCopyButtons($content);
  bindTooltips($content);
}

function buildDetailMetric(label, value, ic) {
  return `
    <div class="detail-metric panel-subtle">
      <div class="detail-metric-icon">${icon(ic, 16)}</div>
      <div>
        <div class="detail-metric-label">${esc(label)}</div>
        <div class="detail-metric-value">${esc(value)}</div>
      </div>
    </div>`;
}

function buildBookMilestones({ sessions = [], annotations = [], totalSessions = 0, firstSession = null, lastSession = null } = {}) {
  sessions = toArray(sessions);
  annotations = toArray(annotations);
  if (!sessions.length && !annotations.length) {
    return '<div class="empty-inline">No timeline data for this book yet.</div>';
  }

  const ascSessions = [...sessions]
    .filter((s) => Number(s?.start_time) > 0)
    .sort((a, b) => Number(a.start_time) - Number(b.start_time));
  const descSessions = [...ascSessions].reverse();
  const firstOpenSession = Number(firstSession?.start_time) > 0 ? firstSession : (ascSessions[0] || null);
  const lastOpenSession = Number(lastSession?.start_time) > 0 ? lastSession : (descSessions[0] || null);
  const annAsc = [...annotations]
    .map((a) => ({ ...a, __dt: parseDateLike(a.datetime || a.datetime_updated) }))
    .filter((a) => a.__dt)
    .sort((a, b) => a.__dt - b.__dt);

  const points = [];
  if (firstOpenSession) {
    const s = firstOpenSession;
    points.push({
      key: 'first-open',
      label: 'First open',
      when: formatSessionTimestamp(s.start_time),
      meta: `${s.page ? `p.${s.page}` : 'page ?'}${s.total_pages ? ` / ${s.total_pages}` : ''} · ${formatDuration(s.duration || 0)}`,
      kind: 'open',
    });
  }
  if (annAsc[0]) {
    const a = annAsc[0];
    points.push({
      key: 'first-annotation',
      label: 'First annotation',
      when: formatAnnotationDate(a.datetime || a.datetime_updated),
      meta: `${getAnnotationKind(a)}${a.pageno ? ` · p.${a.pageno}` : ''}${a.chapter ? ` · ${a.chapter}` : ''}`,
      kind: 'annotation',
    });
  }
  if (lastOpenSession) {
    const s = lastOpenSession;
    points.push({
      key: 'last-open',
      label: 'Last open',
      when: formatSessionTimestamp(s.start_time),
      meta: `${s.page ? `p.${s.page}` : 'page ?'}${s.total_pages ? ` / ${s.total_pages}` : ''} · ${formatDuration(s.duration || 0)}`,
      kind: 'last',
    });
  }

  return `
    <div class="timeline-summary panel-subtle">
      <div class="timeline-summary-meta">
        <span>${t('%1 reading sessions', fmtNumber(totalSessions || sessions.length))}</span>
        <span>${t('%1 annotations', fmtNumber(annotations.length))}</span>
      </div>
      <div class="milestone-track">
        ${points.map((p, idx) => `
          <div class="milestone-point ${esc(p.kind)}">
            <div class="milestone-line ${idx === points.length - 1 ? 'end' : ''}"></div>
            <div class="milestone-dot"></div>
            <div class="milestone-card">
              <div class="milestone-label">${esc(p.label)}</div>
              <div class="milestone-when">${esc(p.when || 'Unknown time')}</div>
              <div class="milestone-meta">${esc(p.meta || '')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

/* ============================================================
   Highlights page
   ============================================================ */
async function renderHighlights() {
  const hlToken = renderToken;
  const data = await api('highlights');
  const highlights = dedupeAnnotationsForDisplay(toArray(data && data.highlights).length ? toArray(data.highlights) : toArray(data));
  const q = (state.highlightsSearch || '').trim().toLowerCase();
  const typeFilter = state.highlightsType || 'all';
  const sortMode = state.highlightsSort || 'recent';

  const filtered = highlights.filter((h) => {
    const kind = getAnnotationKind(h);
    if (typeFilter !== 'all' && kind !== typeFilter) return false;
    if (!q) return true;
    return `${h.book_title || ''} ${h.book_authors || ''} ${h.chapter || ''} ${h.text || ''} ${h.note || ''}`
      .toLowerCase()
      .includes(q);
  });

  const groups = new Map();
  filtered.forEach((h) => {
    const groupKey = getBookRef(h.book_ref || h.book_id || `${normalizeLooseTitle(h.book_title)}::${normalizeLooseTitle(h.book_authors)}`);
    if (!groups.has(groupKey)) groups.set(groupKey, {
      id: groupKey,
      book_ref: getBookRef(h.book_ref || h.book_id),
      book_md5: getBookRef(h.book_md5),
      title: h.book_title,
      authors: h.book_authors,
      items: [],
    });
    groups.get(groupKey).items.push(h);
  });

  const groupsList = [...groups.values()].map((g) => {
    g.items.sort((a, b) => {
      const ad = parseDateLike(a.datetime || a.datetime_updated)?.getTime() || 0;
      const bd = parseDateLike(b.datetime || b.datetime_updated)?.getTime() || 0;
      return bd - ad;
    });
    g.lastTs = parseDateLike(g.items[0]?.datetime || g.items[0]?.datetime_updated)?.getTime() || 0;
    g.noteCount = g.items.filter((a) => getAnnotationKind(a) === 'note').length;
    return g;
  });

  groupsList.sort((a, b) => {
    if (sortMode === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
    if (sortMode === 'count') return (b.items.length - a.items.length) || (b.lastTs - a.lastTs);
    return (b.lastTs - a.lastTs) || (b.items.length - a.items.length);
  });

  if (hlToken !== renderToken) return; // stale render
  $content.innerHTML = `
    <div class="view-fade">
      <section class="panel highlights-panel">
        <div class="section-head">
          <div>
            <div class="section-kicker">Highlights</div>
            <h1>All highlights</h1>
            <div class="section-note" id="hlSummaryNote">${t('%1 items across %2 books', fmtNumber(filtered.length), fmtNumber(groupsList.length))}</div>
          </div>
          <div class="highlight-controls">
            <div class="search-box compact">
              <span class="ic">${icon('search', 15)}</span>
              <input id="hlSearch" type="text" placeholder="Search highlights" value="${esc(state.highlightsSearch || '')}">
            </div>
            <select id="hlTypeFilter" class="compact-select">
              <option value="all" ${typeFilter === 'all' ? 'selected' : ''}>All</option>
              <option value="highlight" ${typeFilter === 'highlight' ? 'selected' : ''}>Highlights</option>
              <option value="note" ${typeFilter === 'note' ? 'selected' : ''}>Notes</option>
            </select>
            <select id="hlSort" class="compact-select">
              <option value="recent" ${sortMode === 'recent' ? 'selected' : ''}>Recent</option>
              <option value="count" ${sortMode === 'count' ? 'selected' : ''}>Count</option>
              <option value="title" ${sortMode === 'title' ? 'selected' : ''}>Title</option>
            </select>
            <div class="highlight-bulk-actions">
              <div class="segmented-inline">
                <button class="ghost-btn tiny" id="hlExpandAll" type="button">Expand all</button>
                <button class="ghost-btn tiny" id="hlCollapseAll" type="button">Collapse all</button>
              </div>
              <button class="ghost-btn tiny icon-only-btn" id="hlExportAll" type="button" title="Export JSON" aria-label="Export JSON">${icon('download', 15)}</button>
            </div>
          </div>
        </div>

        <div id="hlList" class="highlight-groups">
          ${groupsList.length ? groupsList.map((g) => `
            <section class="highlight-group ${state.highlightsCollapsed[g.id] ? 'collapsed' : ''}" data-group="${esc(g.id)}">
              <button class="highlight-group-head" type="button" data-group-toggle="${esc(g.id)}">
                <div class="highlight-group-cover">${renderBookCover({ title: g.title, authors: g.authors, cover_url: g.book_ref ? bookCoverUrl(g.book_ref) : '' }, { variant: 'thumb' })}</div>
                <div>
                  <h3>${esc(g.title || 'Untitled')}</h3>
                  <p>${esc(g.authors || '')}</p>
                </div>
                <div class="highlight-group-actions">
                  ${g.noteCount ? `<span class="count-pill muted">${g.noteCount}N</span>` : ''}
                  <span class="count-pill">${g.items.length}</span>
                  <span class="chev">${icon('chevron', 14)}</span>
                </div>
              </button>
              <div class="highlight-group-body">
                <div class="annotations-list">${g.items.map(a => buildAnnotationCard(a)).join('')}</div>
                <div class="empty-inline highlight-group-empty" style="display:none">No matching highlights in this book.</div>
              </div>
            </section>`).join('') : '<div class="empty-inline">No highlights found.</div>'}
        </div>
      </section>
    </div>`;

  document.getElementById('hlSearch')?.addEventListener('input', (e) => {
    state.highlightsSearch = e.target.value || '';
    debounceRun('highlightsSearch', () => applyHighlightsSearchInPlace(), 120);
  });
  document.getElementById('hlTypeFilter')?.addEventListener('change', (e) => {
    state.highlightsType = e.target.value || 'all';
    savePrefs();
    renderHighlights();
  });
  document.getElementById('hlSort')?.addEventListener('change', (e) => {
    state.highlightsSort = e.target.value || 'recent';
    savePrefs();
    renderHighlights();
  });
  document.getElementById('hlExpandAll')?.addEventListener('click', () => {
    groupsList.forEach((g) => { state.highlightsCollapsed[g.id] = false; });
    document.querySelectorAll('.highlight-group').forEach((el) => el.classList.remove('collapsed'));
    applyHighlightsSearchInPlace();
  });
  document.getElementById('hlCollapseAll')?.addEventListener('click', () => {
    groupsList.forEach((g) => { state.highlightsCollapsed[g.id] = true; });
    document.querySelectorAll('.highlight-group').forEach((el) => el.classList.add('collapsed'));
    applyHighlightsSearchInPlace();
  });
  document.getElementById('hlExportAll')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const day = new Date().toISOString().slice(0, 10);
    const json = buildHighlightsExportJSON(groupsList);
    downloadTextFile(`kocloud-highlights-${day}.json`, json, 'application/json;charset=utf-8');
    flashButtonTitle(btn, t('Exported JSON'));
  });
  document.querySelectorAll('[data-group-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.groupToggle;
      state.highlightsCollapsed[id] = !state.highlightsCollapsed[id];
      const group = btn.closest('.highlight-group');
      if (group) group.classList.toggle('collapsed', !!state.highlightsCollapsed[id]);
      applyHighlightsSearchInPlace();
    });
  });
  bindAnnotationCopyButtons($content);
  applyHighlightsSearchInPlace();
  bindTooltips($content);
}

function buildAnnotationCard(a) {
  const hasText = !!(a.text && String(a.text).trim());
  const hasNote = !!(a.note && String(a.note).trim());
  const type = getAnnotationKind(a);
  const color = String(a.color || 'yellow').toLowerCase();
  const showColorTag = !!color && !['gray', 'grey'].includes(color);
  const searchText = `${a.book_title || ''} ${a.book_authors || ''} ${a.chapter || ''} ${a.text || ''} ${a.note || ''}`.toLowerCase();
  const copyPayload = encodeURIComponent(buildAnnotationCopyText(a));
  return `
    <article class="annotation-card ${hasNote ? 'has-note' : ''}" data-search-text="${esc(searchText)}">
      <button class="ghost-btn tiny icon-only-btn annotation-copy-btn" type="button" data-copy-annotation="${esc(copyPayload)}" title="Copy annotation" aria-label="Copy annotation">${icon('copy', 15)}</button>
      <div class="annotation-head">
        <div class="annotation-badges">
          <span class="badge">${esc(type)}</span>
          ${showColorTag ? `<span class="badge outline">${esc(color)}</span>` : ''}
          ${a.chapter ? `<span class="badge outline">${esc(a.chapter)}</span>` : ''}
        </div>
        <div class="annotation-head-right">
          <div class="annotation-date">${esc(formatAnnotationDate(a.datetime || ''))}</div>
        </div>
      </div>
      ${hasText ? `<blockquote class="annotation-text">${esc(a.text)}</blockquote>` : ''}
      ${hasNote ? `<div class="annotation-note"><div class="annotation-note-label">Note</div><div>${esc(a.note)}</div></div>` : ''}
      <div class="annotation-foot">
        ${a.pageno ? `<span>p.${esc(a.pageno)}</span>` : ''}
        ${a.drawer ? `<span>${esc(a.drawer)}</span>` : ''}
      </div>
    </article>`;
}

function bindAnnotationCopyButtons(root = document) {
  root.querySelectorAll('[data-copy-annotation]').forEach((btn) => {
    if (btn.dataset.copyBound === '1') return;
    btn.dataset.copyBound = '1';
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const payload = decodeURIComponent(btn.dataset.copyAnnotation || '');
      const ok = await copyTextToClipboard(payload);
      flashButtonTitle(btn, ok ? t('Copied') : t('Copy failed'));
      if (ok) flashButtonIcon(btn, 'check', 1000, 'copied');
    });
  });
}

function buildAnnotationCopyText(a) {
  const lines = [];
  if (a.book_title) lines.push(`Book: ${a.book_title}`);
  if (a.book_authors) lines.push(`Author: ${a.book_authors}`);
  if (a.chapter) lines.push(`Chapter: ${a.chapter}`);
  if (a.pageno) lines.push(`Page: ${a.pageno}`);
  if (a.datetime) lines.push(`Date: ${formatAnnotationDate(a.datetime)}`);
  if (a.text) {
    if (lines.length) lines.push('');
    lines.push(String(a.text));
  }
  if (a.note) {
    if (a.text) lines.push('');
    lines.push(`Note: ${String(a.note)}`);
  }
  return lines.join('\n').trim();
}


function buildHighlightsExportJSON(groupsList) {
  const rows = [];
  groupsList.forEach((g) => {
    (g.items || []).forEach((a) => {
      rows.push({
        book_id: g.id ?? null,
        book_ref: g.book_ref || a.book_ref || null,
        book_md5: g.book_md5 || a.book_md5 || '',
        book_title: g.title || '',
        book_authors: g.authors || '',
        type: getAnnotationKind(a),
        color: a.color || '',
        chapter: a.chapter || '',
        page: a.pageno || '',
        datetime: a.datetime || a.datetime_updated || '',
        text: a.text || '',
        note: a.note || '',
        drawer: a.drawer || '',
      });
    });
  });
  return JSON.stringify({
    exported_at: new Date().toISOString(),
    books: groupsList.length,
    items: rows.length,
    rows,
  }, null, 2);
}

/* ============================================================
   Bootstrap
   ============================================================ */
setupChrome();
updateActiveNav();
installI18n();
render();

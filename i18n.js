<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PNS Resource Tile Calc</title>
  <style>
    :root {
      --bg-color: #f4f6f8;
      --card-bg: #ffffff;
      --text-color: #333333;
      --border-color: #cccccc;
      --header-bg: #e9ecef;
      --sticky-bg: #f8f9fa;
      --primary-color: #007bff;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      padding: 12px;
      display: flex;
      justify-content: center;
    }

    .container {
      width: 100%;
      max-width: 960px; /* Expanded for full table view on desktop */
      background: var(--card-bg);
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Header Bar */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .title {
      font-size: 1.15rem;
      font-weight: bold;
    }

    .lang-select {
      padding: 6px 8px;
      font-size: 0.85rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    /* Controls Area (Global Buff & Seconds Toggle) */
    .controls-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
      background: #f0f4f8;
      padding: 10px 14px;
      border-radius: 6px;
    }

    .buff-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .buff-group label {
      font-weight: bold;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
      cursor: pointer;
      user-select: none;
    }

    .number-input {
      width: 68px;
      padding: 4px 6px;
      font-size: 0.95rem;
      text-align: right;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }

    /* Table Styles & Horizontal Scroll Wrapper */
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      -webkit-overflow-scrolling: touch;
    }

    table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      white-space: nowrap;
      font-size: 0.85rem;
    }

    th, td {
      padding: 8px 6px;
      text-align: center;
      border-bottom: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
      background-color: var(--card-bg);
    }

    th {
      background-color: var(--header-bg);
      font-weight: bold;
    }

    /* Sticky Columns Layout */
    .col-sticky-1 {
      position: sticky;
      left: 0;
      z-index: 2;
      background-color: var(--sticky-bg);
      min-width: 80px;
      font-weight: bold;
      text-align: left;
      padding-left: 8px;
    }

    .col-sticky-2 {
      position: sticky;
      left: 80px;
      z-index: 2;
      background-color: var(--sticky-bg);
      min-width: 76px;
      border-right: 2px solid #a0a0a0 !important;
    }

    th.col-sticky-1, th.col-sticky-2 {
      z-index: 3;
      background-color: var(--header-bg);
      text-align: center;
      padding-left: 6px;
    }

    /* Icon Placeholder inside Resource Name Cell */
    .res-cell-content {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .res-icon-placeholder {
      width: 20px;
      height: 20px;
      display: inline-block;
      background-color: #e2e8f0;
      border-radius: 3px;
      flex-shrink: 0;
    }

    /* Time Result Cell */
    .time-cell {
      font-family: monospace;
      font-size: 0.88rem;
      min-width: 52px; /* Optimized to fit mobile screen without seconds */
    }

    /* Shareable URL Container */
    .share-container {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px dashed var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .share-title {
      font-size: 0.82rem;
      color: #666;
      font-weight: bold;
    }

    .share-input-group {
      display: flex;
      gap: 6px;
    }

    .share-url-input {
      flex: 1;
      padding: 6px 8px;
      font-size: 0.8rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: #f8f9fa;
      color: #555;
    }

    .copy-btn {
      padding: 6px 12px;
      font-size: 0.8rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
    }

    .copy-btn:active {
      opacity: 0.8;
    }
  </style>
</head>
<body>

<div class="container">
  <div class="header-bar">
    <h1 class="title" id="ui-title">Gathering Time Calculator</h1>
    <select id="langSelect" class="lang-select">
      <option value="ja">日本語</option>
      <option value="en">English</option>
      <option value="zh-TW">繁體中文</option>
      <option value="zh-CN">简体中文</option>
      <option value="ko">한국어</option>
      <option value="ru">Русский</option>
    </select>
  </div>

  <div class="controls-container">
    <div class="buff-group">
      <label for="globalBuff" id="ui-globalBuffLabel">Gathering Speed:</label>
      <input type="number" id="globalBuff" class="number-input" step="0.1" min="0" max="300" inputmode="decimal">
      <span>%</span>
    </div>

    <label class="checkbox-group">
      <input type="checkbox" id="showSecondsCheck">
      <span id="ui-showSecondsLabel">Show Seconds</span>
    </label>
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th class="col-sticky-1" id="ui-thResource">Resource</th>
          <th class="col-sticky-2" id="ui-thSpeed">Speed (%)</th>
          <th>Lv7</th>
          <th>Lv6</th>
          <th>Lv5</th>
          <th>Lv4</th>
          <th>Lv3</th>
          <th>Lv2</th>
          <th>Lv1</th>
        </tr>
      </thead>
      <tbody id="tableBody">
        <!-- Dynamically rendered via JS -->
      </tbody>
    </table>
  </div>

  <div class="share-container">
    <span class="share-title" id="ui-shareTitle">Share / Save URL:</span>
    <div class="share-input-group">
      <input type="text" id="shareUrlInput" class="share-url-input" readonly>
      <button id="copyBtn" class="copy-btn">Copy</button>
    </div>
  </div>
</div>

<!-- Load external translation dictionary -->
<script src="i18n.js"></script>

<script>
// --- Master Data ---
const RESOURCE_TYPES = [
  { key: 'food', ratio: 20 },
  { key: 'wood', ratio: 20 },
  { key: 'steel', ratio: 4 },
  { key: 'gas', ratio: 1 }
];

const BASE_AMOUNTS = {
  7: 20000, 6: 14000, 5: 10000, 4: 6750, 3: 4000, 2: 2000, 1: 1000
};

const DEFAULT_SETTINGS = {
  lang: 'ja',
  showSeconds: false,
  globalBuff: 50.0,
  foodSpeed: 50.0,
  woodSpeed: 50.0,
  steelSpeed: 50.0,
  gasSpeed: 50.0
};

let state = { ...DEFAULT_SETTINGS };

// --- Browser Language Auto-Detection ---
function detectBrowserLanguage() {
  const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hk')) return 'zh-TW';
  if (browserLang.startsWith('zh')) return 'zh-CN';
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('ru')) return 'ru';
  if (browserLang.startsWith('en')) return 'en';
  
  return 'ja'; // Default fallback
}

// --- Load Settings (Priority: URL Params > localStorage > Browser Language) ---
function loadState() {
  // 1. Set default language based on browser preference
  state.lang = detectBrowserLanguage();

  // 2. Override with localStorage if available
  const saved = localStorage.getItem('pns_gather_calc_settings');
  if (saved) {
    try {
      state = { ...state, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse localStorage settings:', e);
    }
  }

  // 3. Override with URL query parameters (Highest Priority)
  const params = new URLSearchParams(window.location.search);
  if (params.has('g')) state.globalBuff = parseFloat(params.get('g')) || 0;
  if (params.has('f')) state.foodSpeed = parseFloat(params.get('f')) || 0;
  if (params.has('w')) state.woodSpeed = parseFloat(params.get('w')) || 0;
  if (params.has('s')) state.steelSpeed = parseFloat(params.get('s')) || 0;
  if (params.has('a')) state.gasSpeed = parseFloat(params.get('a')) || 0;
  if (params.has('sec')) state.showSeconds = params.get('sec') === '1';
  if (params.has('lang')) state.lang = params.get('lang');
}

// --- Save Settings and Update Shareable URL ---
function saveAndSync() {
  // Save to localStorage
  localStorage.setItem('pns_gather_calc_settings', JSON.stringify(state));

  // Build URL query string
  const params = new URLSearchParams();
  params.set('g', state.globalBuff);
  params.set('f', state.foodSpeed);
  params.set('w', state.woodSpeed);
  params.set('s', state.steelSpeed);
  params.set('a', state.gasSpeed);
  params.set('sec', state.showSeconds ? '1' : '0');
  params.set('lang', state.lang);

  const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  document.getElementById('shareUrlInput').value = newUrl;
}

// --- Core Calculation Logic ---
function calculateSeconds(baseAmount, globalBuff, specificBuff) {
  const totalBuff = globalBuff + specificBuff;
  const speedFactor = 2160 * ((120 + totalBuff) / 100);
  const rawSeconds = (baseAmount / speedFactor) * 3600;
  return Math.ceil(rawSeconds); // Round up seconds
}

function formatTime(totalSeconds, showSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const pad = (num) => String(num).padStart(2, '0');

  if (showSeconds) {
    const s = totalSeconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(h)}:${pad(m)}`;
}

// --- UI Rendering ---
function updateLanguage() {
  const lang = state.lang;
  const dict = (typeof I18N !== 'undefined' && I18N[lang]) ? I18N[lang] : I18N.ja;

  document.getElementById('ui-title').innerText = dict.title;
  document.getElementById('ui-globalBuffLabel').innerText = dict.globalBuff;
  document.getElementById('ui-showSecondsLabel').innerText = dict.showSeconds;
  document.getElementById('ui-thResource').innerText = dict.resource;
  document.getElementById('ui-thSpeed').innerText = `${dict.speed} (%)`;
  document.getElementById('ui-shareTitle').innerText = dict.shareUrl;
  document.getElementById('copyBtn').innerText = dict.copyBtn;

  RESOURCE_TYPES.forEach(res => {
    const labelElem = document.getElementById(`label-text-${res.key}`);
    if (labelElem) labelElem.innerText = dict[res.key];
  });
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  RESOURCE_TYPES.forEach(res => {
    const tr = document.createElement('tr');

    // Sticky Column 1: Resource Name & Icon Placeholder
    const tdName = document.createElement('td');
    tdName.className = 'col-sticky-1';
    
    const resContent = document.createElement('div');
    resContent.className = 'res-cell-content';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'res-icon-placeholder';
    iconSpan.id = `icon-${res.key}`;
    
    const textSpan = document.createElement('span');
    textSpan.id = `label-text-${res.key}`;

    resContent.appendChild(iconSpan);
    resContent.appendChild(textSpan);
    tdName.appendChild(resContent);
    tr.appendChild(tdName);

    // Sticky Column 2: Specific Buff Input
    const tdInput = document.createElement('td');
    tdInput.className = 'col-sticky-2';
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'number-input';
    input.step = '0.1';
    input.min = '0';
    input.max = '500';
    input.setAttribute('inputmode', 'decimal');
    input.value = state[`${res.key}Speed`];
    input.addEventListener('input', (e) => {
      state[`${res.key}Speed`] = parseFloat(e.target.value) || 0;
      saveAndSync();
      recalculate();
    });
    tdInput.appendChild(input);
    tr.appendChild(tdInput);

    // Lv7 to Lv1 Time Cells
    for (let level = 7; level >= 1; level--) {
      const tdTime = document.createElement('td');
      tdTime.className = 'time-cell';
      tdTime.id = `time-${res.key}-${level}`;
      tr.appendChild(tdTime);
    }

    tbody.appendChild(tr);
  });
}

function recalculate() {
  const globalBuff = parseFloat(state.globalBuff) || 0;

  RESOURCE_TYPES.forEach(res => {
    const specificBuff = parseFloat(state[`${res.key}Speed`]) || 0;
    
    for (let level = 7; level >= 1; level--) {
      const baseAmount = BASE_AMOUNTS[level];
      const seconds = calculateSeconds(baseAmount, globalBuff, specificBuff);
      const cell = document.getElementById(`time-${res.key}-${level}`);
      if (cell) {
        cell.innerText = formatTime(seconds, state.showSeconds);
      }
    }
  });
}

// --- App Initialization ---
function init() {
  loadState();

  // Language selector listener
  const langSelect = document.getElementById('langSelect');
  langSelect.value = state.lang;
  langSelect.addEventListener('change', (e) => {
    state.lang = e.target.value;
    saveAndSync();
    updateLanguage();
  });

  // Global buff input listener
  const globalBuffInput = document.getElementById('globalBuff');
  globalBuffInput.value = state.globalBuff;
  globalBuffInput.addEventListener('input', (e) => {
    state.globalBuff = parseFloat(e.target.value) || 0;
    saveAndSync();
    recalculate();
  });

  // Show seconds checkbox listener
  const showSecondsCheck = document.getElementById('showSecondsCheck');
  showSecondsCheck.checked = state.showSeconds;
  showSecondsCheck.addEventListener('change', (e) => {
    state.showSeconds = e.target.checked;
    saveAndSync();
    recalculate();
  });

  // Share URL Copy button listener
  document.getElementById('copyBtn').addEventListener('click', () => {
    const urlInput = document.getElementById('shareUrlInput');
    urlInput.select();
    navigator.clipboard.writeText(urlInput.value).then(() => {
      const dict = I18N[state.lang] || I18N.ja;
      alert(dict.copied);
    });
  });

  renderTable();
  updateLanguage();
  saveAndSync();
  recalculate();
}

document.addEventListener('DOMContentLoaded', init);
</script>

</body>
</html>

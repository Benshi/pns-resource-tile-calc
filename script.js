const RESOURCE_TYPES = [
  { key: 'food', ratio: 20, hourlySpeed: 36000 },
  { key: 'wood', ratio: 20, hourlySpeed: 28800 },
  { key: 'steel', ratio: 4, hourlySpeed: 5760 },
  { key: 'gas', ratio: 1, hourlySpeed: 1440 }
];

const BASE_AMOUNTS = { 8: 26000, 7: 20000, 6: 14000, 5: 10000, 4: 6750, 3: 4000, 2: 2000, 1: 1000 };
const MAX_CAPACITY_DURATION_SECONDS = 6 * 60 * 60;
const CAPACITY_INTERVALS = [5, 10, 15, 30, 60];
const STORAGE_KEY = 'pns_gather_calc_settings';
const PRESET_STORAGE_KEY = 'pns_gather_calc_presets';
const JAPANESE = {
  title: '資源採取時間計算機', globalBuff: '資源採集速度:', showSeconds: '秒まで表示',
  showLevel8: 'Lv8以上も表示', resource: '資源', speed: '速度', shareUrl: '共有 / 保存用 URL',
  copyBtn: 'コピー', copied: 'URLをクリップボードにコピーしました！', helpBtn: 'バフの確認方法',
  closeBtn: '閉じる', food: '食料', wood: '木材', steel: '鋼材', gas: 'ガス',
  presetLabel: 'プリセット:', presetPlaceholder: '名前 (アカウント名等)', savePreset: '保存',
  deletePreset: '削除', selectPresetDefault: '-- プリセット選択 --', presetSaved: 'プリセットを保存しました。',
  presetDeleted: 'プリセットを削除しました。', levelMode: 'レベル別', capacityMode: '収穫量別',
  resourceSpeed: '資源別採集速度', helpTitle: '採集速度の確認方法', totalResources: '総資源量',
  capacityInterval: '単位時間:'
};

const DEFAULT_SETTINGS = {
  lang: 'ja', mode: 'level', showSeconds: false, showLevel8: false, capacityInterval: 30,
  globalBuff: 0, foodSpeed: 0, woodSpeed: 0, steelSpeed: 0, gasSpeed: 0
};

let state = { ...DEFAULT_SETTINGS };
let presets = {};

function dictionary() {
  const translations = typeof I18N !== 'undefined' && I18N[state.lang] ? I18N[state.lang] : {};
  return { ...JAPANESE, ...translations };
}

function closeOpenTooltips() {
  document.querySelectorAll('.time-cell.is-tooltip-open').forEach((cell) => {
    cell.classList.remove('is-tooltip-open');
  });
  document.getElementById('capacityInterval').addEventListener('change', (event) => {
    state.capacityInterval = Number(event.target.value);
    persistAndSync();
    renderTable();
  });
  document.getElementById('calculatorTable').classList.remove('has-pinned-tooltip');
  document.getElementById('pinnedTooltip').classList.remove('is-visible');
}

function openPinnedTooltip(cell) {
  const tooltip = document.getElementById('pinnedTooltip');
  const cellBounds = cell.getBoundingClientRect();
  tooltip.textContent = cell.dataset.tooltip;
  tooltip.classList.add('is-visible');

  const tooltipBounds = tooltip.getBoundingClientRect();
  const left = Math.min(
    Math.max(12, cellBounds.left + cellBounds.width / 2 - tooltipBounds.width / 2),
    window.innerWidth - tooltipBounds.width - 12
  );
  const top = Math.max(12, cellBounds.top - tooltipBounds.height - 8);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function parseNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function parseCapacityInterval(value) {
  const interval = Number(value);
  return CAPACITY_INTERVALS.includes(interval) ? interval : DEFAULT_SETTINGS.capacityInterval;
}

function getLevels() {
  return Object.keys(BASE_AMOUNTS).map(Number).sort((a, b) => b - a)
    .filter((level) => state.showLevel8 || level < 8);
}

function gatheringRate(resource) {
  const totalSpeed = parseNumber(state.globalBuff) + parseNumber(state[`${resource.key}Speed`]);
  return resource.hourlySpeed * (1 + totalSpeed / 100) / 3600;
}

function calculateTime(resource, level) {
  return Math.ceil((BASE_AMOUNTS[level] * resource.ratio) / gatheringRate(resource));
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const pad = (value) => String(value).padStart(2, '0');
  return state.showSeconds ? `${pad(hours)}:${pad(minutes)}:${pad(seconds % 60)}` : `${pad(hours)}:${pad(minutes)}`;
}

function formatDuration(seconds) {
  return `${Math.floor(seconds / 3600)}:${String((seconds % 3600) / 60).padStart(2, '0')}`;
}

function formatInterval(interval, dict = dictionary()) {
  return interval === 60 ? dict.hour : `${interval}${dict.minutes}`;
}

function formatCapacity(value) {
  return Math.floor(value).toLocaleString();
}

function capacityLevelSegments(resource, startAmount, endAmount) {
  const levels = Object.keys(BASE_AMOUNTS).map(Number).sort((a, b) => a - b);
  const intervalAmount = endAmount - startAmount;
  let lowerBound = 0;

  return levels.flatMap((level, index) => {
    const upperBound = index === levels.length - 1
      ? Number.POSITIVE_INFINITY
      : BASE_AMOUNTS[level] * resource.ratio;
    const coveredAmount = Math.max(0, Math.min(endAmount, upperBound) - Math.max(startAmount, lowerBound));
    lowerBound = upperBound;
    return coveredAmount > 0 ? [{ level, percentage: coveredAmount / intervalAmount * 100 }] : [];
  });
}

function capacityCellContent(resource, seconds, previousSeconds) {
  const rate = gatheringRate(resource);
  const segments = capacityLevelSegments(resource, rate * previousSeconds, rate * seconds);
  const bar = segments.map(({ level, percentage }) =>
    `<span class="capacity-level-segment level-band-${level}" style="width:${percentage}%" title="Lv${level}"></span>`
  ).join('');
  return `<span class="capacity-value">${formatCapacity(rate * seconds)}</span><span class="capacity-level-bar" aria-label="${segments.map(({ level }) => `Lv${level}`).join(', ')}">${bar}</span>`;
}

function visibleColumns() {
  return state.mode === 'level'
    ? getLevels().map((level) => ({ id: `level-${level}`, label: `Lv${level}`, value: level }))
    : Array.from(
      { length: MAX_CAPACITY_DURATION_SECONDS / (state.capacityInterval * 60) },
      (_, index) => (index + 1) * state.capacityInterval * 60
    ).map((seconds) => ({ id: `duration-${seconds}`, label: formatDuration(seconds), value: seconds }));
}

function renderTable() {
  const dict = dictionary();
  const columns = visibleColumns();
  const table = document.getElementById('calculatorTable');
  table.classList.toggle('is-capacity-mode', state.mode === 'capacity');
  table.classList.toggle('is-compact-time-mode', state.mode === 'level' && !state.showSeconds);
  const tableHead = document.getElementById('tableHead');
  const tableBody = document.getElementById('tableBody');
  tableHead.innerHTML = `<tr>
    <th class="resource-column">${dict.resource}</th>
    <th class="speed-column global-speed-cell">
      <label class="global-speed-label" for="globalBuff" id="ui-globalBuffLabel">${dict.globalBuff}</label>
      <span class="speed-input-row"><input class="global-speed-input" type="number" id="globalBuff" min="0" max="999.9" step="0.1" inputmode="decimal" value="${state.globalBuff}"><span class="unit">%</span></span>
    </th>
    ${columns.map((column) => state.mode === 'level'
      ? `<th class="level-header">${column.label}<span class="level-header-bar level-band-${column.value}"></span></th>`
      : `<th>${column.label}</th>`
    ).join('')}
  </tr>`;
  tableBody.innerHTML = RESOURCE_TYPES.map((resource) => {
    const cells = columns.map((column, index) => {
      const content = state.mode === 'level'
        ? formatTime(calculateTime(resource, column.value))
        : capacityCellContent(resource, column.value, index === 0 ? 0 : columns[index - 1].value);
      const className = state.mode === 'capacity' ? 'capacity-cell' : 'time-cell';
      const tooltip = state.mode === 'level'
        ? ` data-tooltip="${dict[resource.key]} Lv${column.value}&#10;総資源数:${formatCapacity(BASE_AMOUNTS[column.value] * resource.ratio)}" tabindex="0"`
        : '';
      return `<td class="${className}" data-result="${resource.key}-${column.id}"${tooltip}>${content}</td>`;
    }).join('');
    renderCapacityLegend();
    return `<tr>
      <td class="resource-column">
        <span class="resource-label"><img class="resource-icon" src="img/icon/${resource.key}.png" alt=""><span>${dict[resource.key]}</span></span>
      </td>
      <td class="speed-column"><input class="resource-speed" type="number" min="0" max="999.9" step="0.1" inputmode="decimal" data-resource="${resource.key}" value="${state[`${resource.key}Speed`]}"><span class="unit">%</span></td>
      ${cells}
    </tr>`;
  }).join('');

  document.querySelectorAll('[data-resource]').forEach((input) => {
    input.addEventListener('input', (event) => {
      state[`${event.target.dataset.resource}Speed`] = parseNumber(event.target.value);
      persistAndSync();
      updateTableValues();
    });
  });
  document.getElementById('globalBuff').addEventListener('input', (event) => {
    state.globalBuff = parseNumber(event.target.value);
    persistAndSync();
    updateTableValues();
  });
  document.querySelectorAll('.time-cell').forEach((cell) => {
    cell.addEventListener('click', () => {
      const wasOpen = cell.classList.contains('is-tooltip-open');
      closeOpenTooltips();
      if (!wasOpen) {
        cell.classList.add('is-tooltip-open');
        document.getElementById('calculatorTable').classList.add('has-pinned-tooltip');
        openPinnedTooltip(cell);
      }
    });
  });
}

function updateTableValues() {
  visibleColumns().forEach((column) => {
    RESOURCE_TYPES.forEach((resource) => {
      const cell = document.querySelector(`[data-result="${resource.key}-${column.id}"]`);
      if (!cell) return;
      cell.textContent = state.mode === 'level'
        ? formatTime(calculateTime(resource, column.value))
        : '';
      if (state.mode === 'capacity') {
        const columnIndex = visibleColumns().findIndex(({ id }) => id === column.id);
        const previousSeconds = columnIndex === 0 ? 0 : visibleColumns()[columnIndex - 1].value;
        cell.innerHTML = capacityCellContent(resource, column.value, previousSeconds);
      }
    });
  });
}

function renderCapacityLegend() {
  const legend = document.getElementById('capacityLegend');
  const levels = state.mode === 'level'
    ? getLevels().sort((a, b) => a - b)
    : Object.keys(BASE_AMOUNTS).map(Number).sort((a, b) => a - b);
  legend.innerHTML = levels
    .map((level) => `<span class="capacity-legend-item"><span class="capacity-legend-swatch level-band-${level}"></span>Lv${level}</span>`)
    .join('');
}

function renderPresetOptions(selectedName = '') {
  const select = document.getElementById('presetSelect');
  const dict = dictionary();
  select.replaceChildren(new Option(dict.selectPresetDefault, ''));
  Object.keys(presets).sort((a, b) => a.localeCompare(b)).forEach((name) => {
    select.add(new Option(name, name, false, name === selectedName));
  });
}

function persistAndSync() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const parameters = new URLSearchParams({
    g: state.globalBuff, f: state.foodSpeed, w: state.woodSpeed, s: state.steelSpeed, a: state.gasSpeed,
    sec: state.showSeconds ? '1' : '0', l8: state.showLevel8 ? '1' : '0', mode: state.mode, ci: state.capacityInterval, lang: state.lang
  });
  document.getElementById('shareUrlInput').value = `${location.origin}${location.pathname}?${parameters}`;
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && typeof stored === 'object') state = { ...state, ...stored };
  } catch (error) {
    console.error('Unable to restore calculator settings.', error);
  }
  const parameters = new URLSearchParams(location.search);
  const keys = { g: 'globalBuff', f: 'foodSpeed', w: 'woodSpeed', s: 'steelSpeed', a: 'gasSpeed' };
  Object.entries(keys).forEach(([parameter, key]) => {
    if (parameters.has(parameter)) state[key] = parseNumber(parameters.get(parameter));
  });
  if (parameters.has('sec')) state.showSeconds = parameters.get('sec') === '1';
  if (parameters.has('l8')) state.showLevel8 = parameters.get('l8') === '1';
  if (parameters.get('mode') === 'capacity') state.mode = 'capacity';
  state.capacityInterval = parseCapacityInterval(parameters.get('ci') || state.capacityInterval);
  if (typeof I18N !== 'undefined' && I18N[parameters.get('lang')]) state.lang = parameters.get('lang');
}

function loadPresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY));
    if (stored && typeof stored === 'object') presets = stored;
  } catch (error) {
    console.error('Unable to restore calculator presets.', error);
  }
}

function updateLanguage() {
  const dict = dictionary();
  document.documentElement.lang = state.lang;
  document.title = dict.title;
  document.getElementById('ui-title').textContent = dict.title;
  document.getElementById('ui-presetLabel').textContent = dict.presetLabel;
  document.getElementById('presetNameInput').placeholder = dict.presetPlaceholder;
  document.getElementById('savePresetBtn').textContent = dict.savePreset;
  document.getElementById('deletePresetBtn').textContent = dict.deletePreset;
  document.getElementById('ui-globalBuffLabel').textContent = dict.globalBuff;
  document.getElementById('ui-showSecondsLabel').textContent = dict.showSeconds;
  document.getElementById('ui-showLevel8Label').textContent = dict.showLevel8;
  document.getElementById('ui-capacityIntervalLabel').textContent = dict.capacityInterval;
  document.getElementById('ui-shareTitle').textContent = dict.shareUrl;
  document.getElementById('copyBtn').textContent = dict.copyBtn;
  document.getElementById('helpBtn').setAttribute('aria-label', dict.helpBtn);
  document.getElementById('ui-helpBtnText').textContent = dict.helpBtn;
  document.getElementById('helpModalTitle').textContent = dict.helpTitle;
  document.getElementById('closeModalBtn').textContent = dict.closeBtn;
  document.querySelector('[data-mode="level"]').textContent = dict.levelMode;
  document.querySelector('[data-mode="capacity"]').textContent = dict.capacityMode;
  const capacityInterval = document.getElementById('capacityInterval');
  capacityInterval.replaceChildren(...CAPACITY_INTERVALS.map((interval) => new Option(
    formatInterval(interval, dict),
    String(interval),
    false,
    interval === state.capacityInterval
  )));
  renderPresetOptions(document.getElementById('presetSelect').value);
}

function savePreset() {
  const input = document.getElementById('presetNameInput');
  const name = input.value.trim();
  if (!name) {
    input.focus();
    return;
  }
  presets[name] = { ...state };
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  renderPresetOptions(name);
  input.value = '';
  alert(dictionary().presetSaved);
}

function deletePreset() {
  const select = document.getElementById('presetSelect');
  if (!select.value || !presets[select.value]) return;
  delete presets[select.value];
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  renderPresetOptions();
  alert(dictionary().presetDeleted);
}

function applyPreset(name) {
  if (!presets[name]) return;
  state = { ...DEFAULT_SETTINGS, ...presets[name] };
  synchronizeControls();
  persistAndSync();
  updateLanguage();
  renderTable();
}

function synchronizeControls() {
  document.getElementById('langSelect').value = state.lang;
  document.getElementById('showSecondsCheck').checked = state.showSeconds;
  document.getElementById('showLevel8Check').checked = state.showLevel8;
  document.getElementById('capacityInterval').value = String(state.capacityInterval);
  document.getElementById('levelOptions').classList.toggle('is-hidden', state.mode !== 'level');
  document.getElementById('capacityOptions').classList.toggle('is-hidden', state.mode !== 'capacity');
  document.querySelectorAll('.mode-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === state.mode);
  });
}

function openHelp() {
  const modal = document.getElementById('helpModal');
  const image = document.getElementById('helpImage');
  image.onerror = () => {
    if (!image.src.endsWith('/img/help/ja.png')) image.src = 'img/help/ja.png';
  };
  image.src = `img/help/${state.lang}.png`;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('closeModalIcon').focus();
}

function closeHelp() {
  const modal = document.getElementById('helpModal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById('helpBtn').focus();
}

async function copyShareUrl() {
  const input = document.getElementById('shareUrlInput');
  try {
    await navigator.clipboard.writeText(input.value);
  } catch (error) {
    input.select();
    document.execCommand('copy');
  }
  alert(dictionary().copied);
}

function initialize() {
  loadState();
  loadPresets();
  synchronizeControls();
  renderTable();
  updateLanguage();
  persistAndSync();

  document.getElementById('langSelect').addEventListener('change', (event) => {
    state.lang = event.target.value;
    persistAndSync();
    updateLanguage();
    renderTable();
  });
  document.getElementById('showSecondsCheck').addEventListener('change', (event) => {
    state.showSeconds = event.target.checked;
    persistAndSync();
    renderTable();
  });
  document.getElementById('showLevel8Check').addEventListener('change', (event) => {
    state.showLevel8 = event.target.checked;
    persistAndSync();
    renderTable();
  });
  document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    synchronizeControls();
    persistAndSync();
    renderTable();
  }));
  document.getElementById('presetSelect').addEventListener('change', (event) => applyPreset(event.target.value));
  document.getElementById('savePresetBtn').addEventListener('click', savePreset);
  document.getElementById('deletePresetBtn').addEventListener('click', deletePreset);
  document.getElementById('copyBtn').addEventListener('click', copyShareUrl);
  document.getElementById('helpBtn').addEventListener('click', openHelp);
  document.getElementById('closeModalBtn').addEventListener('click', closeHelp);
  document.getElementById('closeModalIcon').addEventListener('click', closeHelp);
  document.getElementById('helpModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeHelp();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('helpModal').classList.contains('active')) closeHelp();
    if (event.key === 'Escape') closeOpenTooltips();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.time-cell, .tooltip-popup')) closeOpenTooltips();
  });
}

document.addEventListener('DOMContentLoaded', initialize);

# PNS Resource Tile Calculator - Copilot Instructions & Specifications

## Project Overview
This project (`pns-resource-tile-calc`) is a web-based gathering time calculator for *Puzzle & Survival* (PnP), hosted on GitHub Pages.

---

## 1. Codebase & Language Standards
* **Source Code Comments**: Write ALL code comments (JavaScript, CSS, HTML inline notes) in **English** for standard readability.
* **i18n & Default Language Rules**:
  * Default/Fallback UI language MUST be **Japanese (ja)**.
  * If `i18n.js` is missing, fails to load, or encounters missing keys, always fall back gracefully to Japanese text so the UI never breaks.
  * **Target language list**: the game supports 19 languages total (see the tracking issues for the full list/status): English, Japanese, Simplified Chinese, Traditional Chinese, Korean, Russian, French, German, Spanish, Indonesian, Vietnamese, Turkish, Thai, Italian, Portuguese, Malay, Arabic, Polish, Dutch. Text translations (`i18n.js`) and help images (`img/help/{lang}.png`) are rolled out incrementally language-by-language; check the "言語サポート" and "ヘルプ画像提供" GitHub issues for current status before assuming a language is (or isn't) done.
  * **Help image fallback**: `img/help/{lang}.png` may not exist yet for newly-added languages. `openHelp()` must fall back from the current language to **English**, and finally to **Japanese**, in that order (skipping duplicates), so the help popup never shows a broken image.

---

## 2. UI, Theme & Layout Guidelines

### Theme & Styling (Dark Theme)
* Implement a modern, high-contrast **Dark Theme UI** across all components.
* Design specs:
  * **Background**: Very dark charcoal/black (e.g., `#121212` or `#1e1e2e`).
  * **Card / Table Containers**: Dark navy/gray (e.g., `#252630` or `#181825`).
  * **Text**: High legibility off-white/light gray (`#e0e0e0`, `#ffffff`).
  * **Accents & Highlights**: Soft neon green/teal for global speed inputs, vibrant purple/blue for resource inputs, dark red for delete/danger actions.
  * **Borders**: Subtle dark borders (`#333344`) to separate grid cells cleanly.

### Layout Compression & Grid Sizing
* **Overall Layout Compression**:
  * Reduce padding/margin between sections (e.g., 24px -> 12px) to minimize unnecessary scrolling and fit critical elements within the primary viewport.
  * Optimize line heights and text headers to save vertical space.
* **Enlarged Resource Grids**:
  * Utilize the saved vertical space from layout compression to make the **Resource Grids larger and more visible**.
  * Increase font/icon sizes within resource cells for better readability.
  * Ensure responsive auto-fitting grid layouts (e.g., expanding from 2 columns to 3-4 columns on wider screens).

### Header Responsive Structure
* **PC/Wide**: 1 row -> `[Title]` `[Preset Area]` `[Language Select]`
* **Tablet**: 2 rows -> Row 1: `[Title]` (Left) & `[Language Select]` (Right) / Row 2: `[Preset Area]`
* **Mobile**: 3 rows -> Row 1: `[Title]` & `[Language Select]` / Row 2: `[Preset Dropdown]` / Row 3: `[Name Input]` `[Save]` `[Delete]` `[?]`

### Emoji & Assets
* **Favicon**: Always retain SVG calculator emoji:
  `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🧮%3C/text%3E%3C/svg%3E">`
* **Country Flag Emoji**:
  * Use flag emojis inside `<select id="langSelect">` options.
  * Apply explicit CSS font stack:
    `font-family: "Twemoji Country Flags", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;`

---

## 3. Interactive Features & Display Logic

### Level Expansion & Filtering
* **Future Level Scalability**: Keep the master data structure extensible so that Lv.9 and above can be easily appended once official values are released. Do NOT hardcode or guess unreleased level values.
* **Lv.8+ Visibility Toggle**: 
  * Controlled via the "Lv8以上も表示" (Show Lv8+) checkbox.
  * When unchecked, hide columns for Lv.8 and above.
  * When checked, render Lv.8 (and future added levels) columns.
* **Initial Scroll Position**: On page load, automatically scroll the table horizontally so that **Lv.7** is prominently visible in the viewport.
* **Smooth Layout Transitions**: Switching checkboxes or view modes MUST trigger smooth CSS transitions/animations (e.g., opacity, column width, or slide effects).

### Time-Based Mode (時間別モード)
* In capacity mode, display time columns at fixed steps of the selected interval (5/10/15/30/60 min), e.g. **0:30, 1:00, 1:30, 2:00, ...** for the 30-minute interval.
* **Level view selector (Lv.9+ only)**: once "Lv8以上も表示" is checked, a dropdown replaces the "資源" header cell with options **Lv1〜8** (default), **Lv9**, **Lv10**, **Lv11**, **Lv12**.
  * **Lv1〜8**: all these levels share the same gathering-speed multiplier (×1), so the classic cumulative/rainbow multi-segment bar is shown, exactly like before Lv.9+ existed.
  * **Lv9 / Lv10 / Lv11 / Lv12**: each of these levels has its own distinct speed multiplier (see below), so selecting one isolates *only* that level — the bar shows a single color across the whole axis, and the amount is `min(that level's own rate × elapsed seconds, that level's own full capacity)`. This intentionally matches Level mode's standalone number for that exact level (do not build a cross-level cumulative curve for Lv.9+, since their per-level standalone times are not monotonic — see the reversal note below).
  * When "Lv8以上も表示" is unchecked, the selector is hidden and the view always behaves as "Lv1〜8" (further capped at Lv.7).
* **Dynamic time axis end**: the last column is NOT a fixed duration. It extends to the time needed for the *slowest* resource to fill the currently selected view's max level capacity (Lv.7 by default, Lv.8 for "Lv1〜8" with Lv8+ checked, or the individually selected Lv.9-12), rounded up to the next whole interval. This recalculates live as buffs, the interval, the Lv8+ toggle, or the level-view selector change.

---

## 4. Master Data & Calculation Rules

Only official and verified level amounts (Lv.1 to Lv.12) should be defined.

```javascript
// Master Data Definition
const RESOURCE_TYPES = [
  { key: 'food', ratio: 20 },
  { key: 'wood', ratio: 20 },
  { key: 'steel', ratio: 4 },
  { key: 'gas', ratio: 1 }
];

const BASE_AMOUNTS = {
  12: 50000,
  11: 44000,
  10: 38000,
  9:  32000,
  8:  26000,
  7:  20000,
  6:  14000,
  5:  10000,
  4:   6750,
  3:   4000,
  2:   2000,
  1:   1000
};

// From Lv.9 onward, the tile's own gathering speed also increases (on top of the buff-based
// rate below). Levels not listed here (1-8, and any future unlisted level) use a multiplier of 1.
const LEVEL_RATE_MULTIPLIERS = { 9: 1.2, 10: 1.4, 11: 1.7, 12: 2.0 };
```

* **Calculation Formula** (matches the officially observed in-game values — all resources reach any given level at the *same* elapsed time when their buffs are equal, because `ratio` scales both the resource capacity and the resource's actual gathering rate, and cancels out):
  * `Resource Capacity = BASE_AMOUNTS[level] * RESOURCE_TYPES[key].ratio`
  * `Total Speed (%) = Global Speed (%) + Resource-specific Speed (%)`
  * `Common Hourly Rate = 2160 * (120 + Total Speed) / 100` (shared by all resources, per 1 unit of `ratio`)
  * `Per-second Rate(level) = RESOURCE_TYPES[key].ratio * Common Hourly Rate / 3600 * (LEVEL_RATE_MULTIPLIERS[level] || 1)`
  * **Level mode ("レベル別")**: each level column is independent — `Time (Seconds) = Math.ceil(Resource Capacity(level) / Per-second Rate(level))`. Because the rate multiplier (Lv.9+) grows faster than the capacity per level, higher levels can legitimately finish *faster* than lower ones (e.g. Lv.11/Lv.12 finishing before Lv.9/Lv.10) — this is expected, verified game behavior, not a bug.
  * **Capacity mode ("時間別")**: for the "Lv1〜8" view (levels sharing multiplier ×1), models a single tile gathering continuously with amounts capped once it reaches the view's max level's capacity (cumulative accumulation is equivalent to independent per-level filling here, since the rate never changes across Lv.1-8). For an individually-selected Lv.9-12 view, the tile is instead modeled standalone at just that level's own rate/capacity (`min(Per-second Rate(level) * elapsed seconds, Resource Capacity(level))`), matching Level mode's number for that level exactly — do NOT chain Lv.1-8's cumulative amount into a Lv.9+ selection, since the resulting number would not match Level mode's (verified-correct) standalone value for that level.
  
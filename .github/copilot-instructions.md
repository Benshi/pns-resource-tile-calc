# PNS Resource Tile Calculator - Copilot Instructions & Specifications

## Project Overview
This project (`pns-resource-tile-calc`) is a web-based gathering time calculator for *Puzzle & Survival* (PnP), hosted on GitHub Pages.

---

## 1. Codebase & Language Standards
* **Source Code Comments**: Write ALL code comments (JavaScript, CSS, HTML inline notes) in **English** for standard readability.
* **i18n & Default Language Rules**:
  * Default/Fallback UI language MUST be **Japanese (ja)**.
  * If `i18n.js` is missing, fails to load, or encounters missing keys, always fall back gracefully to Japanese text so the UI never breaks.

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
* In capacity mode, display time columns based on target duration steps:
  * Intervals: **0:30, 1:00, 1:30, 2:00, 2:30, 3:00, ..., up to 6:00** (30-minute increments).

---

## 4. Master Data & Calculation Rules

Only official and verified level amounts (Lv.1 to Lv.8) should be defined.

```javascript
// Master Data Definition
const RESOURCE_TYPES = [
  { key: 'food', ratio: 20 },
  { key: 'wood', ratio: 20 },
  { key: 'steel', ratio: 4 },
  { key: 'gas', ratio: 1 }
];

const BASE_AMOUNTS = {
  8: 26000,
  7: 20000,
  6: 14000,
  5: 10000,
  4:  6750,
  3:  4000,
  2:  2000,
  1:  1000
};
```

* **Calculation Formula** (matches the officially observed in-game values — all resources reach any given level at the *same* elapsed time when their buffs are equal, because `ratio` scales both the resource capacity and the resource's actual gathering rate, and cancels out):
  * `Resource Capacity = BASE_AMOUNTS[level] * RESOURCE_TYPES[key].ratio`
  * `Total Speed (%) = Global Speed (%) + Resource-specific Speed (%)`
  * `Common Hourly Rate = 2160 * (120 + Total Speed) / 100` (shared by all resources, per 1 unit of `ratio`)
  * `Per-second Rate = RESOURCE_TYPES[key].ratio * Common Hourly Rate / 3600`
  * `Time (Seconds) = Math.ceil(Resource Capacity / Per-second Rate)`
  * The same `Per-second Rate` is used for capacity ("時間別") mode, where `Capacity = Per-second Rate * elapsed seconds`.

---

## 5. Development Workflow

### Pull Request Creation
* The built-in `create_pull_request` tool is unreliable in this environment (fails with "runtime settings are not configured for this session"), even after VS Code restarts/re-auth.
* **Always use the `gh pr create` CLI command** to open pull requests instead of the built-in tool. Example:
  `gh pr create --repo Benshi/pns-resource-tile-calc --base main --head <branch> --title "<title>" --body "<body>"`
* `gh` is installed via winget and authenticated as `Benshi`. If a fresh PowerShell session doesn't find `gh` on PATH, refresh it first:
  `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`

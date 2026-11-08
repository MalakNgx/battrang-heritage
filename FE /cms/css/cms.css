/* cms.css — CMS Gốm Bát Tràng */

:root {
  --bg: #f5f5f5;
  --bg2: #ffffff;
  --bg3: #eeebe7;
  --border: #d8d4d0;
  --text: #1a1a1a;
  --text2: #666;
  --accent: #8b5e3c;
  --accent2: #c2956a;
  --danger: #c0392b;
  --radius: 8px;
  --topbar-h: 52px;
  --nav-w: 200px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  color: var(--text);
  background: var(--bg);
  overflow: hidden;
}

/* ===== TOPBAR ===== */

.topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--topbar-h);
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
}

.brand { font-size: 15px; color: var(--text); }
.brand span { color: var(--text2); }

/* ===== APP LAYOUT ===== */

.app-layout {
  display: flex;
  margin-top: var(--topbar-h);
  height: calc(100vh - var(--topbar-h));
}

/* ===== LEFT NAV ===== */

.nav-sidebar {
  width: var(--nav-w);
  background: var(--bg2);
  border-right: 1px solid var(--border);
  padding: 12px 0;
  flex-shrink: 0;
}

.nav-sidebar ul { list-style: none; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 20px;
  cursor: pointer;
  color: var(--text2);
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--bg3);
  color: var(--text);
}

.nav-item.active {
  background: var(--bg3);
  color: var(--accent);
  font-weight: 600;
  border-left-color: var(--accent);
}

/* ===== PAGE AREA ===== */

.page-area {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}

.page {
  padding: 24px;
  max-width: 1100px;
}

.page.hidden { display: none; }

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
}

.page-desc {
  color: var(--text2);
  margin-bottom: 16px;
}

/* ===== DASHBOARD ===== */

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.dash-header .page-title { margin-bottom: 0; }

.period-tabs {
  display: flex;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.period-tab {
  padding: 7px 16px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--text2);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: inherit;
}

.period-tab:not(:last-child) { border-right: 1px solid var(--border); }
.period-tab:hover { background: var(--bg3); color: var(--text); }
.period-tab.active { background: var(--accent); color: #fff; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

.stat-label {
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.stat-sub {
  font-size: 11px;
  color: var(--text2);
  margin-top: 6px;
}

.chart-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.chart-bar-wrap canvas,
.chart-pie-wrap canvas {
  max-height: 260px;
}

/* ===== PRODUCTS PAGE ===== */

#page-products {
  padding: 0;
  max-width: none;
}

.products-layout {
  display: flex;
  height: calc(100vh - var(--topbar-h));
}

.product-sidebar {
  width: 260px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--bg2);
  flex-shrink: 0;
}

.product-sidebar-head {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 8px;
}

.product-sidebar-head input {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  font-size: 13px;
  color: var(--text);
  outline: none;
}

.product-sidebar-head input:focus {
  border-color: var(--accent2);
}

.product-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 6px 0;
}

.product-item {
  padding: 10px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.15s;
}

.product-item:hover { background: var(--bg3); }

.product-item.selected {
  background: var(--bg3);
  border-left-color: var(--accent);
}

.product-item-name {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-item-id {
  font-size: 11px;
  color: var(--text2);
  margin-top: 2px;
}

.storage-note {
  padding: 8px 12px;
  font-size: 11px;
  color: var(--text2);
  border-top: 1px solid var(--border);
}

.product-editor {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg);
}

/* ===== EMPTY STATE ===== */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  color: var(--text2);
  text-align: center;
  gap: 12px;
}

.empty-icon { font-size: 48px; }
.empty-state h2 { font-size: 16px; color: var(--text); }
.empty-state p { font-size: 13px; line-height: 1.6; }

/* ===== EDITOR FORM ===== */

.editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.editor-head h2 {
  font-size: 17px;
  font-weight: 600;
}

.editor-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* ===== TABS ===== */

.etabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
  gap: 2px;
}

.etab {
  padding: 9px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: var(--text2);
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s;
  margin-bottom: -1px;
}

.etab:hover { color: var(--text); }

.etab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.panel { display: none; }
.panel.active { display: block; }

/* ===== FORM GRID ===== */

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-col { display: flex; flex-direction: column; gap: 16px; }

/* ===== FIELD ===== */

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span, .field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field input, .field textarea, .field select {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg2);
  font-size: 14px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus, .field textarea:focus {
  border-color: var(--accent2);
}

.field small {
  font-size: 11px;
  color: var(--text2);
}

.field textarea {
  resize: vertical;
  min-height: 100px;
}

/* ===== SWITCH ===== */

.switch {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.switch input[type="checkbox"] {
  width: 36px;
  height: 20px;
  appearance: none;
  background: var(--border);
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.switch input[type="checkbox"]::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.switch input[type="checkbox"]:checked { background: var(--accent); }
.switch input[type="checkbox"]:checked::after { left: 19px; }

.switch span { font-size: 13px; color: var(--text); }

/* ===== THUMBNAIL ===== */

.thumb-box {
  width: 100%;
  aspect-ratio: 4/3;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--text2);
  font-size: 13px;
  margin-bottom: 8px;
}

.thumb-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ===== LAYER FIELDS ===== */

.layer-field {
  margin-bottom: 20px;
}

.layer-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.layer-hint {
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 6px;
  line-height: 1.5;
}

.layer-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg2);
  font-size: 14px;
  color: var(--text);
  font-family: inherit;
  resize: vertical;
  min-height: 90px;
  outline: none;
  transition: border-color 0.15s;
}

.layer-field textarea:focus { border-color: var(--accent2); }

.panel-intro {
  color: var(--text2);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--bg3);
  border-radius: var(--radius);
}

/* ===== CHAT LOGS ===== */

.logs-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.logs-toolbar input {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg2);
  font-size: 14px;
  color: var(--text);
  outline: none;
}

.logs-toolbar input:focus { border-color: var(--accent2); }

.logs-toolbar select {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg2);
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  outline: none;
}

.table-wrap {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow-x: auto;
  margin-bottom: 12px;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.log-table th {
  text-align: left;
  padding: 11px 16px;
  background: var(--bg3);
  color: var(--text2);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}

.log-table td {
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: top;
}

.log-table tr:last-child td { border-bottom: none; }
.log-table tr:hover td { background: var(--bg3); }

.lang-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  background: var(--bg3);
  color: var(--text2);
  border: 1px solid var(--border);
}

/* ===== BUTTONS ===== */

.row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.btn.primary:hover { background: #7a5234; }

.btn.ghost {
  background: var(--bg2);
  color: var(--text);
  border-color: var(--border);
}

.btn.ghost:hover { background: var(--bg3); }

.btn.danger {
  background: var(--bg2);
  color: var(--danger);
  border-color: #e8b4b0;
}

.btn.danger:hover { background: #fdf0ef; }

.file-btn { cursor: pointer; }

/* ===== TOAST ===== */

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text);
  color: #fff;
  padding: 10px 20px;
  border-radius: var(--radius);
  font-size: 13px;
  z-index: 999;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transition: opacity 0.3s;
}

.toast.hidden { display: none; }

/* ===== UTILS ===== */

.muted { color: var(--text2); }
.small { font-size: 12px; }

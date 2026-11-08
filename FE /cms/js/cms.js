// cms.js — CMS Gốm Bát Tràng

// Dữ liệu mẫu cho lịch sử chat (backend chưa có endpoint đọc ChatLogs)
const MOCK_LOGS = [
  { time: '08/11 09:12', product: 'SP001', question: 'What is this vase made of?', lang: 'en-US' },
  { time: '08/11 09:35', product: 'SP001', question: 'この花瓶はいくらですか？', lang: 'ja-JP' },
  { time: '08/11 10:02', product: 'SP002', question: '이 도자기의 역사는 어떻게 됩니까?', lang: 'ko-KR' },
  { time: '08/11 10:45', product: 'SP001', question: 'Bình này làm từ chất liệu gì vậy?', lang: 'vi-VN' },
  { time: '08/11 11:23', product: 'SP002', question: 'Comment est fabriquée cette poterie?', lang: 'fr-FR' },
  { time: '08/11 12:01', product: 'SP001', question: '这个花瓶是用什么材料做的？', lang: 'zh-CN' },
  { time: '08/11 13:15', product: 'SP001', question: 'Who made this piece? How long does it take?', lang: 'en-US' },
  { time: '08/11 14:30', product: 'SP002', question: 'Nghệ nhân nào tạo ra sản phẩm này?', lang: 'vi-VN' },
  { time: '08/11 15:08', product: 'SP001', question: '何度で焼いていますか？', lang: 'ja-JP' },
  { time: '08/11 16:22', product: 'SP002', question: 'Quelle est la signification du motif de lotus?', lang: 'fr-FR' },
  { time: '08/11 17:45', product: 'SP001', question: 'Is this handmade or machine made?', lang: 'en-US' },
  { time: '08/11 18:03', product: 'SP001', question: '이것은 얼마입니까?', lang: 'ko-KR' },
];

// Dữ liệu mẫu theo kỳ
const PERIOD_DATA = {
  day: {
    qr: 8, chat: 23,
    barLabels: ['6h', '8h', '10h', '12h', '14h', '16h', '18h'],
    barValues: [1, 3, 2, 5, 4, 6, 3],
  },
  month: {
    qr: 354, chat: 612,
    barLabels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    barValues: [0, 0, 0, 0, 0, 45, 62, 38, 71, 55, 83, 0],
  },
  year: {
    qr: 1240, chat: 2850,
    barLabels: ['2024', '2025', '2026'],
    barValues: [210, 580, 450],
  },
};

// Thống kê ngôn ngữ (mẫu)
const LANG_DATA = {
  labels: ['English', 'Tiếng Việt', '日本語', '한국어', '中文', 'Français'],
  values: [38, 22, 15, 12, 8, 5],
  colors: ['#4e79a7', '#8b5e3c', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'],
};

// === NAVIGATION ===

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.querySelectorAll('.page').forEach(el => {
    el.classList.toggle('hidden', el.id !== `page-${page}`);
  });

  if (page === 'dashboard') loadDashboard();
  if (page === 'products') loadProductList();
  if (page === 'chat-logs') loadChatLogs();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});

// === DASHBOARD ===

let barChartInst = null;
let pieChartInst = null;
let currentPeriod = 'day';

async function loadDashboard() {
  const products = await CmsDB.getAll();
  document.getElementById('stat-products').textContent = products.length;
  updatePeriodStats(currentPeriod);
  renderBarChart(currentPeriod);
  renderPieChart();
}

function updatePeriodStats(period) {
  const d = PERIOD_DATA[period];
  document.getElementById('stat-qr-today').textContent = d.qr;
  document.getElementById('stat-chat-today').textContent = d.chat;

  const topLang = LANG_DATA.labels[0];
  document.getElementById('stat-top-lang').textContent = 'EN';

  const labelMap = { day: 'Hôm nay', month: 'Tháng này', year: 'Năm nay' };
  document.getElementById('stat-qr-label').textContent = labelMap[period] + ' · mẫu';
  document.getElementById('stat-chat-label').textContent = labelMap[period] + ' · mẫu';
}

function renderBarChart(period) {
  const d = PERIOD_DATA[period];
  const ctx = document.getElementById('bar-chart').getContext('2d');
  if (barChartInst) barChartInst.destroy();

  barChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.barLabels,
      datasets: [{
        label: 'Lượt quét QR',
        data: d.barValues,
        backgroundColor: '#c2956a',
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderPieChart() {
  const ctx = document.getElementById('pie-chart').getContext('2d');
  if (pieChartInst) pieChartInst.destroy();

  pieChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: LANG_DATA.labels,
      datasets: [{
        data: LANG_DATA.values,
        backgroundColor: LANG_DATA.colors,
        borderWidth: 1,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } },
      },
    },
  });
}

// Period filter
document.querySelectorAll('.period-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentPeriod = tab.dataset.period;
    updatePeriodStats(currentPeriod);
    renderBarChart(currentPeriod);
  });
});

// === PRODUCTS ===

let currentId = null; // ProductID đang chỉnh sửa

async function loadProductList() {
  const products = await CmsDB.getAll();
  const list = document.getElementById('product-list');
  const query = document.getElementById('search').value.toLowerCase();

  const filtered = products.filter(r =>
    r.product.ProductName.toLowerCase().includes(query) ||
    r.product.ProductID.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    list.innerHTML = '<li style="padding:16px;color:#999;text-align:center">Không có sản phẩm</li>';
    return;
  }

  list.innerHTML = filtered.map(r => `
    <li class="product-item ${r.product.ProductID === currentId ? 'selected' : ''}"
        data-id="${r.product.ProductID}">
      <div class="product-item-name">${r.product.ProductName || '(Chưa đặt tên)'}</div>
      <div class="product-item-id">${r.product.ProductID} · ${r.product.Category || 'Chưa phân loại'}</div>
    </li>
  `).join('');

  list.querySelectorAll('.product-item').forEach(el => {
    el.addEventListener('click', () => openProduct(el.dataset.id));
  });
}

async function openProduct(id) {
  currentId = id;
  const record = await CmsDB.get(id);
  if (!record) return;
  renderForm(record);
  await loadProductList(); // cập nhật trạng thái selected
}

function renderForm(record) {
  document.getElementById('empty-state').hidden = true;
  const form = document.getElementById('editor-form');
  form.hidden = false;

  document.getElementById('editor-title').textContent = record.product.ProductName || 'Sản phẩm mới';

  // Điền thông tin chung
  form.querySelectorAll('[data-field]').forEach(el => {
    const path = el.dataset.field.split('.');
    const val = record[path[0]]?.[path[1]];
    if (el.type === 'checkbox') el.checked = !!val;
    else el.value = val ?? '';
  });

  // Khoá ID nếu đã lưu
  document.getElementById('f-id').disabled = !!record.product.ProductID;

  // Thumbnail
  const thumbBox = document.getElementById('thumb-box');
  if (record.thumbnail) {
    const url = URL.createObjectURL(record.thumbnail);
    thumbBox.innerHTML = `<img src="${url}" alt="thumb">`;
  } else if (record.product.ThumbnailUrl) {
    thumbBox.innerHTML = `<img src="${record.product.ThumbnailUrl}" alt="thumb" onerror="this.parentElement.textContent='Không tải được ảnh'">`;
  } else {
    thumbBox.textContent = 'Chưa có ảnh';
  }

  // 5 lớp văn hóa
  renderLayerFields(record);
}

function renderLayerFields(record) {
  const container = document.getElementById('layer-fields');
  container.innerHTML = LAYER_FIELDS.map(layer => `
    <div class="layer-field">
      <div class="layer-label">${layer.icon} ${layer.label}</div>
      <div class="layer-hint">${layer.hint}</div>
      <textarea data-layer="${layer.key}" rows="3">${record.culturalProfile[layer.key] || ''}</textarea>
    </div>
  `).join('');
}

function getFormData(record) {
  const form = document.getElementById('editor-form');

  // Thông tin chung
  form.querySelectorAll('[data-field]').forEach(el => {
    const path = el.dataset.field.split('.');
    if (el.type === 'checkbox') record[path[0]][path[1]] = el.checked;
    else record[path[0]][path[1]] = el.value;
  });

  // 5 lớp
  document.querySelectorAll('[data-layer]').forEach(el => {
    record.culturalProfile[el.dataset.layer] = el.value;
  });

  return record;
}

function openNewForm() {
  currentId = null;
  const record = emptyRecord();
  document.getElementById('empty-state').hidden = true;
  document.getElementById('editor-form').hidden = false;
  document.getElementById('editor-title').textContent = 'Sản phẩm mới';
  document.getElementById('f-id').disabled = false;

  // Reset form
  document.getElementById('editor-form').querySelectorAll('[data-field]').forEach(el => {
    if (el.type === 'checkbox') el.checked = true;
    else el.value = '';
  });
  document.getElementById('thumb-box').textContent = 'Chưa có ảnh';
  renderLayerFields(record);

  // Reset tabs
  switchTab('general');

  // Bỏ selected trong list
  document.querySelectorAll('.product-item').forEach(el => el.classList.remove('selected'));
}

// Save
document.getElementById('editor-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('f-id').value.trim();
  if (!id) return showToast('Vui lòng nhập mã sản phẩm');

  let record;
  if (currentId) {
    record = await CmsDB.get(currentId);
  } else {
    const existing = await CmsDB.get(id);
    if (existing) return showToast(`Mã ${id} đã tồn tại`);
    record = emptyRecord(id);
  }

  record = getFormData(record);
  if (thumbBlob) record.thumbnail = thumbBlob;

  await CmsDB.put(record);
  currentId = record.product.ProductID;
  document.getElementById('editor-title').textContent = record.product.ProductName || currentId;
  document.getElementById('f-id').disabled = true;
  await loadProductList();
  showToast('Đã lưu ✓');
});

// Delete
document.getElementById('btn-delete').addEventListener('click', async () => {
  if (!currentId) return;
  if (!confirm(`Xóa sản phẩm ${currentId}?`)) return;
  await CmsDB.remove(currentId);
  currentId = null;
  document.getElementById('editor-form').hidden = true;
  document.getElementById('empty-state').hidden = false;
  await loadProductList();
  showToast('Đã xóa');
});

// New button
document.getElementById('btn-new').addEventListener('click', openNewForm);

// Search
document.getElementById('search').addEventListener('input', loadProductList);

// Tabs
document.querySelectorAll('.etab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

function switchTab(tabId) {
  document.querySelectorAll('.etab').forEach(el => el.classList.toggle('active', el.dataset.tab === tabId));
  document.querySelectorAll('.panel').forEach(el => el.classList.toggle('active', el.dataset.panel === tabId));
}

// Thumbnail upload
let thumbBlob = null;

document.getElementById('thumb-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  thumbBlob = file;
  const url = URL.createObjectURL(file);
  document.getElementById('thumb-box').innerHTML = `<img src="${url}" alt="thumb">`;
});

document.getElementById('btn-thumb-remove').addEventListener('click', () => {
  thumbBlob = null;
  document.getElementById('thumb-box').textContent = 'Chưa có ảnh';
  document.getElementById('thumb-input').value = '';
});

// Datalist danh mục
const catList = document.getElementById('category-list');
CATEGORIES.forEach(c => {
  const opt = document.createElement('option');
  opt.value = c;
  catList.appendChild(opt);
});

// QR download
document.getElementById('btn-qr-download').addEventListener('click', () => {
  if (!currentId) return showToast('Lưu sản phẩm trước');
  const base = location.href.replace('/cms/index.html', '/index.html').replace('/cms/', '/');
  const pwaUrl = base.includes('index.html') ? base : base + 'index.html';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pwaUrl + '?p=' + currentId)}`;
  window.open(qrUrl, '_blank');
});

// QR print
document.getElementById('btn-qr-print').addEventListener('click', () => {
  if (!currentId) return showToast('Lưu sản phẩm trước');
  const base = location.href.replace('/cms/index.html', '/index.html').replace('/cms/', '/');
  const pwaUrl = base.includes('index.html') ? base : base + 'index.html';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pwaUrl + '?p=' + currentId)}`;
  const win = window.open('', '_blank', 'width=420,height=520');
  win.document.write(`
    <html><head><title>QR — ${currentId}</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:30px">
      <h3 style="margin-bottom:16px">QR — ${currentId}</h3>
      <img src="${qrUrl}" width="300" height="300" onload="window.print()">
      <p style="margin-top:16px;font-size:12px;color:#666">${currentId}</p>
    </body></html>
  `);
  win.document.close();
});

// === CHAT LOGS ===

function loadChatLogs() {
  renderLogs(MOCK_LOGS);

  document.getElementById('log-search').addEventListener('input', filterLogs);
  document.getElementById('log-filter-lang').addEventListener('change', filterLogs);
}

function filterLogs() {
  const query = document.getElementById('log-search').value.toLowerCase();
  const lang = document.getElementById('log-filter-lang').value;
  const filtered = MOCK_LOGS.filter(log => {
    const matchQ = log.question.toLowerCase().includes(query) || log.product.toLowerCase().includes(query);
    const matchL = !lang || log.lang === lang;
    return matchQ && matchL;
  });
  renderLogs(filtered);
}

function renderLogs(logs) {
  const tbody = document.getElementById('log-tbody');
  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#999">Không có dữ liệu</td></tr>';
    return;
  }
  tbody.innerHTML = logs.map(log => `
    <tr>
      <td style="white-space:nowrap;color:#666">${log.time}</td>
      <td><b>${log.product}</b></td>
      <td>${log.question}</td>
      <td><span class="lang-badge">${log.lang}</span></td>
    </tr>
  `).join('');
}

// === TOAST ===

function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), duration);
}

// === INIT ===

(async () => {
  await CmsDB.seedIfEmpty(seedRecords());
  await loadDashboard();
})();

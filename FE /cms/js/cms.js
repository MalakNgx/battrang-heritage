// cms.js — CMS Gốm Bát Tràng

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
const API_BASE_URL = 'http://localhost:5035/api';

// 1. Kiểm tra Authentication ngay khi tải trang CMS
(function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
    }
})();

// Hàm Đăng xuất
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// 2. Hàm Wrapper gửi Request có đính kèm JWT Token
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
    });

    if (response.status === 401 || response.status === 403) {
        alert('Phiên đăng nhập đã hết hạn hoặc bạn không có quyền!');
        logout();
        return null;
    }

    return response;
}

// === NAVIGATION (QUẢN LÝ CHUYỂN TRANG SIDEBAR DUY NHẤT) ===
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const pageId = item.dataset.page; // 'dashboard', 'products', 'chat-logs', 'stats'
    
    // 1. Đổi class active cho menu item
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    // 2. Ẩn tất cả các trang đi
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    // 3. Hiện đúng trang được chọn
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
    }

    // 4. Kích hoạt hàm tải dữ liệu tương ứng theo từng trang
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'products') loadProductList();
    if (pageId === 'chat-logs') loadChatLogs();
    if (pageId === 'stats') loadPopularProductsStats();
  });
});

// === DASHBOARD ===

let barChartInst = null;
let pieChartInst = null;
let currentPeriod = 'day';

async function loadDashboard() {
  try {
    // 1. Lấy tổng số sản phẩm thật
    const resProducts = await fetchWithAuth('/product');
    if (resProducts && resProducts.ok) {
      const products = await resProducts.json();
      document.getElementById('stat-products').textContent = products.length;
    }

    // 2. Lấy số liệu thống kê chat và tương tác thật từ Backend
    const resStats = await fetchWithAuth('/chat/stats/dashboard?period=' + currentPeriod);
    if (resStats && resStats.ok) {
      const stats = await resStats.json();
      
      document.getElementById('stat-chat-today').textContent = stats.totalChats;
      document.getElementById('stat-qr-today').textContent = stats.totalQrScans;
      
      // Xóa chữ "· mẫu" đi để thể hiện đây là dữ liệu thật
      document.getElementById('stat-qr-label').textContent = 'Dữ liệu thời gian thực';
      document.getElementById('stat-chat-label').textContent = 'Dữ liệu từ CSDL';
    }

  } catch (error) {
    console.error("Lỗi tải dữ liệu Dashboard:", error);
  }

  renderBarChart(currentPeriod);
  renderPieChart();
}

async function updatePeriodStats(period) {
  try {
    const res = await fetchWithAuth(`/chat/stats/dashboard?period=${period}`);
    if (res && res.ok) {
      const data = await res.json();
      
      // 1. Hiển thị số lượt chat và lượt quét QR tính toán từ DB
      document.getElementById('stat-chat-today').textContent = data.totalChats;
      document.getElementById('stat-qr-today').textContent = data.totalQrScans;
      
      // 2. Hiển thị Ngôn ngữ phổ biến (chuyển đổi từ 'en-US' -> 'EN', 'vi-VN' -> 'VI'...)
      let topLangCode = data.topLanguage || 'vi-VN';
      let shortLang = topLangCode.split('-')[0].toUpperCase();
      document.getElementById('stat-top-lang').textContent = shortLang;

      const labelMap = { day: 'Hôm nay', month: 'Tháng này', year: 'Năm nay' };
      document.getElementById('stat-qr-label').textContent = labelMap[period] + ' · CSDL';
      document.getElementById('stat-chat-label').textContent = labelMap[period] + ' · CSDL';

      // 3. Nếu có dữ liệu phân bố ngôn ngữ từ DB, cập nhật luôn cho biểu đồ tròn (Pie Chart)
      if (data.languageDistribution && data.languageDistribution.length > 0) {
        const labels = data.languageDistribution.map(item => item.language);
        const values = data.languageDistribution.map(item => item.count);
        renderDynamicPieChart(labels, values);
      }
    }
  } catch (err) {
    console.error("Lỗi cập nhật thống kê kỳ:", err);
  }
}

// Hàm vẽ biểu đồ tròn động từ dữ liệu thật
function renderDynamicPieChart(labels, values) {
  const ctx = document.getElementById('pie-chart').getContext('2d');
  if (pieChartInst) pieChartInst.destroy();

  pieChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#4e79a7', '#8b5e3c', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'],
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
let currentId = null;

async function loadProductList() {
    try {
        const res = await fetchWithAuth('/product');
        if (!res || !res.ok) return;

        const products = await res.json();
        const list = document.getElementById('product-list');
        const query = document.getElementById('search').value.toLowerCase();

        const filtered = products.filter(r =>
            (r.productName && r.productName.toLowerCase().includes(query)) ||
            (r.productID && r.productID.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            list.innerHTML = '<li style="padding:16px;color:#999;text-align:center">Không có sản phẩm trong cơ sở dữ liệu</li>';
            return;
        }

        list.innerHTML = filtered.map(r => `
            <li class="product-item ${r.productID === currentId ? 'selected' : ''}"
                data-id="${r.productID}">
              <div class="product-item-name">${r.productName || '(Chưa đặt tên)'}</div>
              <div class="product-item-id">${r.productID} · ${r.category || 'Chưa phân loại'}</div>
            </li>
        `).join('');

        list.querySelectorAll('.product-item').forEach(el => {
            el.addEventListener('click', () => openProduct(el.dataset.id));
        });

    } catch (error) {
        console.error("Lỗi kết nối khi tải danh sách sản phẩm:", error);
    }
}

async function openProduct(id) {
    currentId = id;
    try {
        const res = await fetchWithAuth('/product');
        if (!res || !res.ok) return;
        const products = await res.json();
        const record = products.find(p => p.productID === id);
        
        if (!record) return;

        document.getElementById('empty-state').hidden = true;
        const form = document.getElementById('editor-form');
        form.hidden = false;

        document.getElementById('editor-title').textContent = record.productName || 'Chi tiết sản phẩm';

        document.getElementById('f-id').value = record.productID || '';
        document.getElementById('f-name').value = record.productName || '';
        document.getElementById('f-category').value = record.category || '';
        document.getElementById('f-id').disabled = true;

        if (record.culturalProfile) {
            document.querySelectorAll('[data-layer]').forEach(el => {
                const layerKey = el.dataset.layer;
                let val = '';
                if (layerKey === 'identity') val = record.culturalProfile.identityLayer;
                if (layerKey === 'symbolism') val = record.culturalProfile.symbolismLayer;
                if (layerKey === 'craftsmanship') val = record.culturalProfile.craftsmanshipLayer;
                if (layerKey === 'artisan') val = record.culturalProfile.artisanStory;
                if (layerKey === 'cultural') val = record.culturalProfile.culturalConnection;
                
                el.value = val || '';
            });
        }

        await loadProductList();
    } catch (e) {
        console.error("Lỗi khi mở sản phẩm:", e);
    }
}

function getFormData(record) {
  const form = document.getElementById('editor-form');
  form.querySelectorAll('[data-field]').forEach(el => {
    const path = el.dataset.field.split('.');
    if (el.type === 'checkbox') record[path[0]][path[1]] = el.checked;
    else record[path[0]][path[1]] = el.value;
  });

  document.querySelectorAll('[data-layer]').forEach(el => {
    record.culturalProfile[el.dataset.layer] = el.value;
  });

  return record;
}

function openNewForm() {
  currentId = null;
  document.getElementById('empty-state').hidden = true;
  document.getElementById('editor-form').hidden = false;
  document.getElementById('editor-title').textContent = 'Sản phẩm mới';
  document.getElementById('f-id').disabled = false;

  document.getElementById('editor-form').querySelectorAll('[data-field]').forEach(el => {
    if (el.type === 'checkbox') el.checked = true;
    else el.value = '';
  });
  document.getElementById('thumb-box').textContent = 'Chưa có ảnh';
  switchTab('general');

  document.querySelectorAll('.product-item').forEach(el => el.classList.remove('selected'));
}

document.getElementById('editor-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('f-id').value.trim();
  if (!id) return showToast('Vui lòng nhập mã sản phẩm');

  let record = { product: { ProductID: id }, culturalProfile: {} };
  record = getFormData(record);

  const payload = {
      ProductID: record.product.ProductID,
      ProductName: record.product.ProductName,
      Category: record.product.Category,
      ThumbnailUrl: record.product.ThumbnailUrl || "",
      QrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:5035/api/chat/${record.product.ProductID}`,
      IsActive: record.product.IsActive !== false,
      CulturalProfile: {
          IdentityLayer: record.culturalProfile.IdentityLayer || "",
          SymbolismLayer: record.culturalProfile.SymbolismLayer || "",
          CraftsmanshipLayer: record.culturalProfile.CraftsmanshipLayer || "",
          ArtisanStory: record.culturalProfile.ArtisanStory || "",
          CulturalConnection: record.culturalProfile.CulturalConnection || ""
      }
  };

  try {
      const method = currentId ? 'PUT' : 'POST';
      const endpoint = currentId ? `/product/${currentId}` : '/product';

      const response = await fetchWithAuth(endpoint, {
          method: method,
          body: JSON.stringify(payload)
      });

      if (response && response.ok) {
          currentId = payload.ProductID;
          document.getElementById('editor-title').textContent = payload.ProductName || currentId;
          document.getElementById('f-id').disabled = true;
          showToast('Đã lưu dữ liệu vào Database thành công ✓');
          loadProductList();
      } else {
          const errorMsg = await response.text();
          showToast(`Lỗi Backend: ${errorMsg}`);
      }
  } catch (error) {
      console.error("Lỗi khi lưu sản phẩm:", error);
      showToast("Lỗi kết nối máy chủ C#");
  }
});

document.getElementById('btn-new').addEventListener('click', openNewForm);
document.getElementById('search').addEventListener('input', loadProductList);

document.querySelectorAll('.etab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

function switchTab(tabId) {
  document.querySelectorAll('.etab').forEach(el => el.classList.toggle('active', el.dataset.tab === tabId));
  document.querySelectorAll('.panel').forEach(el => el.classList.toggle('active', el.dataset.panel === tabId));
}

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

// === THỐNG KÊ SẢN PHẨM QUAN TÂM (ĐÃ FIX LỖI 404 ẢNH) ===
async function loadPopularProductsStats() {
  const tbody = document.getElementById('stats-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Đang tải dữ liệu thống kê...</td></tr>`;

  try {
    const res = await fetchWithAuth('/chat/stats/popular-products');
    
    if (res && res.ok) {
      const data = await res.json();
      
      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color:#666;">Chưa có dữ liệu tương tác từ du khách.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.map((item, index) => {
        const hasThumb = item.thumbnail && item.thumbnail.trim() !== '' && !item.thumbnail.endsWith('default.jpg');
        const imgSrc = item.thumbnail.startsWith('/') ? CONFIG.API_BASE + item.thumbnail : item.thumbnail;

        return `
          <tr>
            <td><strong>#${index + 1}</strong></td>
            <td><code>${item.productId}</code></td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                ${hasThumb 
                  ? `<img src="${imgSrc}" width="35" height="35" style="object-fit: cover; border-radius: 4px;" onerror="this.onerror=null; this.parentElement.innerHTML='🏺';">` 
                  : `<span style="font-size: 20px; width: 35px; text-align: center; display: inline-block;">🏺</span>`
                }
                <span>${item.productName}</span>
              </div>
            </td>
            <td><span style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 12px; font-weight: bold;">${item.count} lượt hỏi</span></td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Không thể tải dữ liệu thống kê.</td></tr>`;
    }
  } catch (err) {
    console.error('Lỗi tải thống kê:', err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Lỗi kết nối tới Server.</td></tr>`;
  }
}

// === CHAT LOGS ===
async function loadChatLogs() {
  try {
    const res = await fetchWithAuth('/chat/logs'); 
    if (res && res.ok) {
      const logs = await res.json();
      const formattedLogs = logs.map(item => ({
        time: new Date(item.createdAt || item.CreatedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        product: item.productID || item.ProductID,
        question: item.question || item.Question,
        lang: item.language || item.Language
      }));
      renderLogs(formattedLogs);
    } else {
      renderLogs([]);
    }
  } catch (error) {
    console.error("Lỗi tải lịch sử chat:", error);
    renderLogs([]);
  }
}

function renderLogs(logs) {
  const tbody = document.getElementById('log-tbody');
  if (!tbody) return;
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
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), duration);
}

// === INIT ===
(async () => {
  await loadProductList();
  await loadDashboard();
})();
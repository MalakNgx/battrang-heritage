// js/app.js - Dieu huong man hinh, tab, tai san pham
const App = (() => {
  let currentLang = localStorage.getItem('lang') || 'vi';
  let currentProduct = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Khử dấu "/" bị dư ở cuối URL Cloudflare (nếu có) để tránh lỗi 404
  function getApiBase() {
    return CONFIG.API_BASE.replace(/\/$/, '');
  }

  function showScreen(screenId) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const target = $(`#screen-${screenId}`);
    if (target) target.classList.add('active');
    if (screenId !== 'scanner') {
      try { Scanner.stop(); } catch (_) {}
    }
  }

  function switchTab(tabId) {
    $$('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    $$('.tab-content').forEach(tc => {
      tc.classList.toggle('active', tc.id === `tab-${tabId}`);
    });
    if (tabId === 'viewer3d' && currentProduct && window.Viewer3D) {
      const m = currentProduct.model3d || {};
      Viewer3D.init('viewer3d-canvas', m.modelUrl || m.ModelUrl, m.firingTemp || m.FiringTemp || 1300);
    }
  }

  async function loadProduct(productId) {
    showLoading('Đang tải sản phẩm...');
    try {
      let data;
      if (CONFIG.USE_MOCK) {
        data = MOCK_DATA[productId.toUpperCase()];
        if (!data) {
          toast('Không tìm thấy sản phẩm: ' + productId);
          return;
        }
        await sleep(400);
      } else {
        // Đã sửa chèn thẳng biến getApiBase()
        const res = await fetch(`${getApiBase()}/api/Chat/product/${productId}`);
        if (res.status === 404) {
          toast('Không tìm thấy sản phẩm: ' + productId);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      }

      currentProduct = data;
      renderProductCard(data.product || data.Product);
      renderInfoLayers(data.culturalProfile || data.CulturalProfile);
      
      const m3d = data.model3d || data.Model3d;
      if (m3d) {
        $('#viewer3d-temp').textContent = `🔥 ${m3d.firingTemp || m3d.FiringTemp || 1300}°C`;
        $('#viewer3d-desc').textContent = m3d.description || m3d.Description || '';
      }
      Chat.init(productId, data.culturalProfile || data.CulturalProfile);
      showScreen('product');
      switchTab('chat');
    } catch (err) {
      console.error('loadProduct error:', err);
      toast('Lỗi tải sản phẩm. Vui lòng kiểm tra kết nối Backend.');
    } finally {
      hideLoading();
    }
  }

  const PLACEHOLDER_IMG = '<span class="product-img-placeholder">🏺</span>';

  function renderProductCard(p) {
    if (!p) return;
    const name = p.productName || p.ProductName || '';
    const cat = p.category || p.Category || '';
    const id = p.productId || p.ProductID || '';
    const thumb = p.thumbnailUrl || p.ThumbnailUrl || '';

    $('#product-header-name').textContent = name;
    $('#product-name').textContent = name;
    $('#product-category').textContent = cat;
    $('#product-id-display').textContent = id;

    const wrap = $('.product-img-wrap');
    wrap.innerHTML = PLACEHOLDER_IMG;
    if (thumb) {
      const img = new Image();
      img.alt = name;
      img.onload = () => { wrap.innerHTML = ''; wrap.appendChild(img); };
      img.src = thumb.startsWith('/') ? getApiBase() + thumb : thumb;
    }
  }

  function renderInfoLayers(profile) {
    profile = profile || {};
    const container = $('#info-layers');
    container.innerHTML = '';

    LAYERS.forEach(layer => {
      const val = profile[layer.dbField] || profile[layer.dbField.charAt(0).toLowerCase() + layer.dbField.slice(1)] || '—';
      const label = currentLang === 'vi' ? layer.label_vi : layer.label_en;
      const div = document.createElement('div');
      div.className = 'info-layer';
      div.innerHTML = `
        <button class="info-layer-header" onclick="this.parentElement.classList.toggle('open')">
          <span class="layer-icon">${layer.icon}</span>
          <span>${label}</span>
          <span class="layer-arrow">▼</span>
        </button>
        <div class="info-layer-body">${val}</div>
      `;
      container.appendChild(div);
    });
  }

  function goHome() {
    currentProduct = null;
    if (window.Viewer3D) Viewer3D.dispose();
    showScreen('welcome');
  }

  function setLanguage(lang) {
    if (!LANGUAGES[lang]) return;
    currentLang = lang;
    localStorage.setItem('lang', lang);

    $$('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    $('#btn-change-lang').textContent = LANGUAGES[lang].flag;

    const chatInput = $('#chat-input');
    if (chatInput) chatInput.placeholder = LANGUAGES[lang].placeholder;

    if (currentProduct) {
      renderInfoLayers(currentProduct.culturalProfile || currentProduct.CulturalProfile);
    }
    if (typeof Chat !== 'undefined' && Chat.updateLabels) {
      Chat.updateLabels();
    }
  }

  function showLoading(text) {
    $('#loading-text').textContent = text || 'Đang tải...';
    $('#loading-overlay').classList.remove('hidden');
  }

  function hideLoading() {
    $('#loading-overlay').classList.add('hidden');
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 2500);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function init() {
    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    $('#btn-scan').addEventListener('click', () => {
      showScreen('scanner');
      Scanner.start();
    });

    $('#btn-manual').addEventListener('click', () => {
      const id = $('#input-product-id').value.trim();
      if (id) loadProduct(id);
      else toast('Vui lòng nhập mã sản phẩm');
    });

    $('#input-product-id').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const id = e.target.value.trim();
        if (id) loadProduct(id);
      }
    });

    $('#btn-change-lang').addEventListener('click', () => {
      const langs = Object.keys(LANGUAGES);
      const idx = langs.indexOf(currentLang);
      const next = langs[(idx + 1) % langs.length];
      setLanguage(next);
      toast(`${LANGUAGES[next].flag} ${LANGUAGES[next].label}`);
    });

    setLanguage(currentLang);

    const deepLinkId = new URLSearchParams(location.search).get('p')
                     || (location.hash.match(/^#(SP\d+)$/i) || [])[1]
                     || null;
    if (deepLinkId) loadProduct(deepLinkId);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    showScreen, switchTab, loadProduct, goHome, setLanguage,
    showLoading, hideLoading, toast,
    get currentLang() { return currentLang; },
    get currentProduct() { return currentProduct; },
  };
})();
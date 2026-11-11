// js/scanner.js - Quet ma QR bang camera (html5-qrcode)

const Scanner = (() => {
  let qr = null;
  let running = false;
  let wanted = false;
  let fileBound = false;
  let lastInvalidToast = 0; // Đã thêm khởi tạo biến để không bị lỗi undefined

  // Bat camera
  async function start() {
    wanted = true;
    unlockAudio();
    bindFileInput();
    hideError();
    if (running) return;

    const blocked = getBlockReason();
    if (blocked) { showError(blocked); return; }

    try {
      qr = qr || new Html5Qrcode('qr-reader');
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => {
            const size = Math.floor(Math.min(w, h) * 0.7);
            return { width: size, height: size };
          } },
        onScanSuccess,
        () => {}
      );
      running = true;
      if (!wanted) stop();
    } catch (err) {
      console.error('Camera start error:', err);
      showError(explainError(err));
    }
  }

  // Tat camera
  async function stop() {
    wanted = false;
    if (!qr || !running) return;
    running = false;
    try {
      await qr.stop();
      qr.clear();
    } catch (_) {}
  }

  // Xu ly ket qua quet
  function onScanSuccess(decodedText) {
    const productId = extractProductId(decodedText);
    if (!productId) {
      const now = Date.now();
      if (now - lastInvalidToast > 2000) {
        lastInvalidToast = now;
        App.toast('Mã QR không phải của sản phẩm Bát Tràng');
      }
      return;
    }
    stop();
    openProduct(productId);
  }

  function openProduct(productId) {
    beep();
    App.toast(`Đã quét: ${productId}`);
    App.loadProduct(productId);
  }

  // Trich ProductID tu noi dung QR
  function extractProductId(text) {
    const match = text.match(CONFIG.QR_PATTERN);
    if (match) return match[1].toUpperCase();
    const cleaned = text.trim().toUpperCase();
    return /^SP\d+$/.test(cleaned) ? cleaned : null;
  }

  // Tieng beep khi quet thanh cong (Web Audio API)
  let audioCtx = null;

  function unlockAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {}
  }

  function beep() {
    if (!audioCtx) return;
    try {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (_) {}
  }

  // Du phong: chup / chon anh QR
  function bindFileInput() {
    if (fileBound) return;
    fileBound = true;

    document.getElementById('qr-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;

      if (typeof Html5Qrcode === 'undefined') {
        showError('Không tải được thư viện quét QR. Kiểm tra kết nối Internet.');
        return;
      }

      await stop();
      try {
        const fileReader = new Html5Qrcode('qr-file-reader');
        const text = await fileReader.scanFile(file, false);
        const productId = extractProductId(text);
        if (productId) openProduct(productId);
        else { App.toast('Mã QR không phải của sản phẩm Bát Tràng'); resumeCamera(); }
      } catch (_) {
        App.toast('Không đọc được mã QR trong ảnh, hãy chụp rõ hơn');
        resumeCamera();
      }
    });
  }

  function resumeCamera() {
    if (document.getElementById('screen-scanner').classList.contains('active')) start();
  }

  // Chan doan loi camera
  function getBlockReason() {
    if (typeof Html5Qrcode === 'undefined') {
      return 'Không tải được thư viện quét QR. Kiểm tra kết nối Internet.';
    }
    if (!window.isSecureContext) {
      return `Trình duyệt chỉ cho mở camera trên HTTPS. Bạn đang mở qua "${location.origin}". `
           + 'Hãy dùng nút "Chụp / chọn ảnh mã QR" bên dưới, hoặc mở web bằng địa chỉ HTTPS.';
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'Trình duyệt này không hỗ trợ camera (thường gặp khi mở link trong Zalo/Facebook/Messenger). '
           + 'Hãy mở bằng Chrome hoặc Safari.';
    }
    return null;
  }

  function explainError(err) {
    const name = err?.name || '';
    const msg = String(err?.message || err);
    if (name === 'NotAllowedError' || /Permission/i.test(msg))
      return 'Bạn đã từ chối quyền camera. Vào cài đặt trình duyệt → Quyền trang web → Camera → Cho phép, rồi thử lại.';
    if (name === 'NotFoundError' || /Requested device not found/i.test(msg))
      return 'Không tìm thấy camera trên thiết bị này.';
    if (name === 'NotReadableError' || /Could not start video/i.test(msg))
      return 'Camera đang bị ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.';
    return 'Không mở được camera: ' + msg;
  }

  function showError(text) {
    const el = document.getElementById('scanner-error');
    el.textContent = text;
    el.classList.remove('hidden');
  }

  function hideError() {
    document.getElementById('scanner-error').classList.add('hidden');
  }

  return { start, stop };
})();
// js/chat.js - Chat AI da ngon ngu
const Chat = (() => {
  let productId = null;
  let culturalProfile = null;
  const $ = (sel) => document.querySelector(sel);

  function init(pid, profile) {
    productId = pid;
    culturalProfile = profile;

    const container = $('#chat-messages');
    container.innerHTML = '';

    const lang = App.currentLang;
    const welcomeMsg = LANGUAGES[lang]?.welcome || LANGUAGES.vi.welcome;
    addMessage('ai', welcomeMsg, '🤖 AI Bát Tràng');

    const input = $('#chat-input');
    input.placeholder = LANGUAGES[lang]?.placeholder || 'Hỏi về sản phẩm...';

    bindEvents();
  }

  let eventsBound = false;
  function bindEvents() {
    if (eventsBound) return;
    eventsBound = true;

    $('#btn-send').addEventListener('click', () => {
      const input = $('#chat-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendMessage(text);
    });

    $('#chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        $('#btn-send').click();
      }
    });

    document.querySelectorAll('.action-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        handleAction(chip.dataset.layer);
      });
    });
  }

  async function sendMessage(text) {
    addMessage('user', text);
    const typingEl = showTyping();

    try {
      let aiResponse;

      if (CONFIG.USE_MOCK) {
        await sleep(800 + Math.random() * 700);
        aiResponse = generateMockResponse(text);
      } else {
        const lang = LANGUAGES[App.currentLang]?.apiCode || 'vi-VN';
        const res = await fetch(`${CONFIG.API_BASE}/api/Chat/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: productId,
            question: text,
            language: lang,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `HTTP ${res.status}`);
        }
        const data = await res.json();
        aiResponse = data.answer || data.Answer || 'Xin lỗi, tôi chưa có thông tin.';
      }

      removeTyping(typingEl);
      addMessage('ai', aiResponse, detectSource(text));

    } catch (err) {
      console.error('Chat error:', err);
      removeTyping(typingEl);
      addMessage('ai', 'Xin lỗi, đã xảy ra lỗi kết nối với Backend.');
    }
  }

  function handleAction(layerKey) {
    const layer = LAYERS.find(l => l.key === layerKey);
    if (!layer || !culturalProfile) return;

    const lang = App.currentLang;
    const question = lang === 'vi' ? layer.label_vi : layer.label_en;

    addMessage('user', `${layer.icon} ${question}`);
    const fieldKey = layer.dbField;
    const answer = culturalProfile[fieldKey] || culturalProfile[fieldKey.charAt(0).toLowerCase() + fieldKey.slice(1)];

    const typingEl = showTyping();
    setTimeout(() => {
      removeTyping(typingEl);
      addMessage('ai', answer || 'Chưa có thông tin cho phần này.', `📚 ${question}`);
    }, 300);
  }

  function addMessage(role, text, source) {
    const container = $('#chat-messages');
    const div = document.createElement('div');
    div.className = `msg ${role}`;

    if (role === 'ai' && source) {
      div.innerHTML = `${escapeHtml(text)}<span class="msg-source">${escapeHtml(source)}</span>`;
    } else {
      div.textContent = text;
    }

    container.appendChild(div);
    scrollToBottom();
  }

  function showTyping() {
    const container = $('#chat-messages');
    const div = document.createElement('div');
    div.className = 'msg ai typing';
    div.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    container.appendChild(div);
    scrollToBottom();
    return div;
  }

  function removeTyping(el) {
    if (el && el.parentElement) el.parentElement.removeChild(el);
  }

  function scrollToBottom() {
    const container = $('#chat-messages');
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }

  function detectSource(text) {
    return '🤖 AI Bát Tràng';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return { init };
})();
/**
 * lib.js — Cấu hình, dữ liệu mẫu & các hàm xử lý thuần (không đụng DOM)
 * ─────────────────────────────────────────────────────────────────────
 */

const CMS_CONFIG = {
  // Backend C# — dùng để sinh ThumbnailUrl / ModelUrl trong file SQL xuất ra
  API_BASE: 'http://localhost:5035',
  MAX_VIDEO_MB: 100,
  MAX_DOC_MB: 20,
  MAX_MODEL_MB: 50,
};

/* ─── 5 lớp văn hóa (khớp cột bảng CulturalProfiles) ─── */
const LAYER_FIELDS = [
  { key: 'IdentityLayer',      icon: '🔍', label: '1. Nhận diện',
    hint: 'Sản phẩm là gì? Dáng, kích thước, chất liệu, loại men. VD: Bình hoa dáng củ tỏi cao 35cm, phủ men rạn giả cổ.' },
  { key: 'SymbolismLayer',     icon: '🌸', label: '2. Ý nghĩa văn hóa',
    hint: 'Hoa văn, màu sắc, hình dáng mang ý nghĩa gì trong văn hóa Việt?' },
  { key: 'CraftsmanshipLayer', icon: '🔨', label: '3. Nghệ thuật chế tác',
    hint: 'Quy trình: tạo hình, vẽ/đắp nổi, tráng men, nung ở bao nhiêu độ, trong lò gì, bao lâu?' },
  { key: 'ArtisanStory',       icon: '👨‍🎨', label: '4. Câu chuyện nghệ nhân',
    hint: 'Ai làm ra? Cảm hứng, kỷ niệm, truyền thống gia đình, số năm theo nghề.' },
  { key: 'CulturalConnection', icon: '🌏', label: '5. Kết nối văn hóa',
    hint: 'So sánh với biểu tượng tương tự ở nước khác (Nhật, Hàn, Trung, Pháp...) để du khách dễ liên hệ.' },
];

const CATEGORIES = ['Gốm men rạn', 'Gốm men ngọc', 'Gốm men lam', 'Gốm men nâu', 'Gốm hoa lam', 'Gốm men lục', 'Gốm mộc'];

/* ─── Bản ghi rỗng (cấu trúc = 3 bảng DB + phần media mở rộng) ─── */
function emptyRecord(productId = '') {
  return {
    product: {                       // dbo.Products
      ProductID: productId, ProductName: '', Category: '',
      ThumbnailUrl: '', QrCodeUrl: '', IsActive: true,
      CreatedAt: new Date().toISOString(),
    },
    culturalProfile: Object.fromEntries(                 // dbo.CulturalProfiles
      LAYER_FIELDS.map(l => [l.key, ''])
    ),
    model3d: { ModelUrl: '', FiringTemp: 1300, Description: '' },  // dbo.Model3DAssets
    // ── Mở rộng (DB chưa có bảng tương ứng) ──
    thumbnail: null,      // Blob ảnh đại diện
    modelFile: null,      // Blob file .glb
    modelFileName: '',
    media: [],            // [{ id, kind: 'image'|'video', name, type, blob, caption }]
    documents: [],        // [{ id, name, type, size, blob, text, addedAt }]
  };
}

/* ─── Dữ liệu mẫu ban đầu (lấy từ BatTrangHeritage_DB.sql) ─── */
function seedRecords() {
  const sp001 = emptyRecord('SP001');
  Object.assign(sp001.product, {
    ProductName: 'Bình hoa gốm men rạn Hoa Sen cổ',
    Category: 'Gốm men rạn',
    ThumbnailUrl: 'http://localhost:5035/uploads/products/sp001.jpeg',
  });
  Object.assign(sp001.culturalProfile, {
    IdentityLayer:      'Bình hoa dáng củ tỏi gốm sứ Bát Tràng cao 35cm, phủ men rạn giả cổ.',
    SymbolismLayer:     'Họa tiết Hoa Sen tượng trưng cho sự thanh cao, tinh khiết trong văn hóa Việt.',
    CraftsmanshipLayer: 'Được đắp nổi hoa văn thủ công, nung liên tục ở nhiệt độ 1.300°C trong lò bầu.',
    ArtisanStory:       'Do Nghệ nhân Ưu tú Trần Văn A chế tác từ ký ức đầm sen mùa hạ.',
    CulturalConnection: 'So với hoa sen mang tính thiền của Nhật, hoa sen Việt mang đậm nét đời thường, tươi sáng.',
  });
  return [sp001];
}

/* ─── Mức độ hoàn thiện hồ sơ (để AI trả lời tốt) ─── */
function completeness(r) {
  const checks = [
    ...LAYER_FIELDS.map(l => ({ label: l.label, ok: !!(r.culturalProfile[l.key] || '').trim() })),
    { label: 'Ảnh đại diện',      ok: !!r.thumbnail || !!r.product.ThumbnailUrl },
    { label: 'Hình ảnh / video',  ok: r.media.length > 0 },
    { label: 'Mô tả mô hình 3D',  ok: !!(r.model3d.Description || '').trim() },
  ];
  const done = checks.filter(c => c.ok).length;
  return { checks, percent: Math.round(done / checks.length * 100) };
}

/* ─── Gợi ý mã SP tiếp theo: SP001, SP002 → SP003 ─── */
function suggestNextId(records) {
  const nums = records
    .map(r => /^SP(\d+)$/.exec(r.product.ProductID))
    .filter(Boolean)
    .map(m => parseInt(m[1], 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return 'SP' + String(next).padStart(3, '0');
}

/* ─── Link mở app du khách & ảnh QR ─── */
function buildDeepLink(pwaUrl, productId) {
  const u = new URL(pwaUrl);
  u.searchParams.set('p', productId);
  return u.href;
}

function buildQrImageUrl(data, size = 300) {
  // Cùng dịch vụ đang dùng trong cột QrCodeUrl của DB
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

/* ─── Ngữ cảnh gửi cho AI (khớp định dạng trong GeminiRagService.cs) ─── */
function buildKnowledgeContext(r) {
  const c = r.culturalProfile;
  return [
    `- Lớp 1 (Nhận diện): ${c.IdentityLayer}`,
    `- Lớp 2 (Ý nghĩa văn hóa): ${c.SymbolismLayer}`,
    `- Lớp 3 (Nghệ thuật chế tác): ${c.CraftsmanshipLayer}`,
    `- Lớp 4 (Câu chuyện nghệ nhân): ${c.ArtisanStory}`,
    `- Lớp 5 (Kết nối văn hóa): ${c.CulturalConnection}`,
  ].join('\n');
}

/* ═══════════════════════════════════════════════
   XUẤT SQL — upsert an toàn (không DELETE để tránh
   xóa dây chuyền ChatLogs do ON DELETE CASCADE)
   ═══════════════════════════════════════════════ */
const SQL_RAW = (expr) => ({ raw: expr });

function sqlValue(v) {
  if (v && typeof v === 'object' && 'raw' in v) return v.raw;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  return "N'" + String(v ?? '').replace(/'/g, "''") + "'";
}

function sqlUpsert(table, productId, cols) {
  const id = sqlValue(productId).replace(/^N/, '');   // ProductID là VARCHAR
  const names = Object.keys(cols);
  const sets = names.map(n => `${n} = ${sqlValue(cols[n])}`).join(', ');
  const vals = names.map(n => sqlValue(cols[n])).join(', ');
  return [
    `IF EXISTS (SELECT 1 FROM dbo.${table} WHERE ProductID = ${id})`,
    `    UPDATE dbo.${table} SET ${sets} WHERE ProductID = ${id};`,
    `ELSE`,
    `    INSERT INTO dbo.${table} (ProductID, ${names.join(', ')}) VALUES (${id}, ${vals});`,
  ].join('\n');
}

function buildSql(records, apiBase = CMS_CONFIG.API_BASE) {
  const out = [
    '-- Xuất từ CMS Hồ sơ Văn hóa — Gốm Bát Tràng',
    `-- Thời điểm: ${new Date().toLocaleString('vi-VN')}`,
    'USE BatTrangHeritageDB;',
    'GO',
    '',
  ];
  for (const r of records) {
    const p = r.product, c = r.culturalProfile, m = r.model3d;
    const slug = p.ProductID.toLowerCase();
    const thumbUrl = r.thumbnail ? `${apiBase}/uploads/products/${slug}.jpg` : (p.ThumbnailUrl || '');
    const modelUrl = r.modelFile ? `${apiBase}/uploads/models/${slug}.glb` : (m.ModelUrl || '');

    out.push(`-- ===== ${p.ProductID}: ${p.ProductName} =====`);
    if (r.thumbnail) out.push(`-- ⚠ Copy ảnh đại diện vào wwwroot/uploads/products/${slug}.jpg`);
    if (r.modelFile) out.push(`-- ⚠ Copy file 3D vào wwwroot/uploads/models/${slug}.glb`);
    out.push(sqlUpsert('Products', p.ProductID, {
      ProductName: p.ProductName, Category: p.Category,
      ThumbnailUrl: thumbUrl, QrCodeUrl: p.QrCodeUrl || '', IsActive: !!p.IsActive,
    }));
    out.push(sqlUpsert('CulturalProfiles', p.ProductID, {
      ...Object.fromEntries(LAYER_FIELDS.map(l => [l.key, c[l.key] || ''])),
      UpdatedAt: SQL_RAW('GETDATE()'),
    }));
    out.push(sqlUpsert('Model3DAssets', p.ProductID, {
      ModelUrl: modelUrl, FiringTemp: parseInt(m.FiringTemp, 10) || 1300, Description: m.Description || '',
    }));
    out.push('GO', '');
  }
  return out.join('\n');
}

/* ─── Tiện ích ─── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Cho phép test bằng Node
if (typeof module !== 'undefined') {
  module.exports = { LAYER_FIELDS, emptyRecord, seedRecords, completeness, suggestNextId,
                     buildDeepLink, buildQrImageUrl, buildKnowledgeContext, buildSql, escapeHtml };
}


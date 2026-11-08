// config.js - Cau hinh va du lieu mock

// js/config.js - Cau hinh va du lieu mock
const CONFIG = {
  API_BASE: 'http://localhost:5035',
  USE_MOCK: false,
  QR_PATTERN: /(?:\/api\/[Cc]hat(?:\/product)?\/|[?&]p=)([A-Za-z0-9]+)/,
};

const LANGUAGES = {
  vi: { flag: '🇻🇳', label: 'Tiếng Việt',  placeholder: 'Hỏi về sản phẩm này...',      welcome: 'Xin chào! Tôi là trợ lý AI Gốm Bát Tràng. Hãy hỏi tôi về sản phẩm này nhé!', apiCode: 'vi-VN' },
  en: { flag: '🇬🇧', label: 'English',     placeholder: 'Ask about this product...',      welcome: 'Hello! I\'m the Bát Tràng Pottery AI assistant. Feel free to ask me about this product!', apiCode: 'en-US' },
  ja: { flag: '🇯🇵', label: '日本語',        placeholder: 'この製品について聞いてください...', welcome: 'こんにちは！バッチャン焼きのAIアシスタントです。この製品についてお気軽にどうぞ！', apiCode: 'ja-JP' },
  ko: { flag: '🇰🇷', label: '한국어',        placeholder: '이 제품에 대해 물어보세요...',      welcome: '안녕하세요! 바짱 도자기 AI 어시스턴트입니다. 이 제품에 대해 물어보세요!', apiCode: 'ko-KR' },
  zh: { flag: '🇨🇳', label: '中文',          placeholder: '询问关于这个产品...',             welcome: '你好！我是鉢場陶瓷AI助手。欢迎询问关于这个产品的信息！', apiCode: 'zh-CN' },
  fr: { flag: '🇫🇷', label: 'Français',     placeholder: 'Posez une question...',          welcome: 'Bonjour ! Je suis l\'assistant IA de la poterie de Bát Tràng. N\'hésitez pas à me poser des questions !', apiCode: 'fr-FR' },
};

const LAYERS = [
  { key: 'identity',       icon: '🔍', label_vi: 'Nhận diện',           label_en: 'Identity',           dbField: 'IdentityLayer' },
  { key: 'symbolism',      icon: '🌸', label_vi: 'Ý nghĩa hoa văn',    label_en: 'Symbolism',          dbField: 'SymbolismLayer' },
  { key: 'craftsmanship',  icon: '🔨', label_vi: 'Kỹ thuật chế tác',   label_en: 'Craftsmanship',      dbField: 'CraftsmanshipLayer' },
  { key: 'artisan',        icon: '👨‍🎨', label_vi: 'Câu chuyện nghệ nhân', label_en: 'Artisan Story',      dbField: 'ArtisanStory' },
  { key: 'cultural',       icon: '🌏', label_vi: 'Kết nối văn hóa',    label_en: 'Cultural Connection', dbField: 'CulturalConnection' },
];

// Du lieu mau (khop DB schema)
const MOCK_DATA = {
  SP001: {
    product: {
      ProductID:    'SP001',
      ProductName:  'Bình hoa gốm men rạn Hoa Sen cổ',
      Category:     'Gốm men rạn',
      ThumbnailUrl: 'http://localhost:5035/uploads/products/sp001.jpeg',
      QrCodeUrl:    'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:5035/api/chat/SP001',
      IsActive:     true,
    },
    culturalProfile: {
      IdentityLayer:      'Bình hoa dáng củ tỏi gốm sứ Bát Tràng cao 35cm, phủ men rạn giả cổ.',
      SymbolismLayer:     'Họa tiết Hoa Sen tượng trưng cho sự thanh cao, tinh khiết trong văn hóa Việt.',
      CraftsmanshipLayer: 'Được đắp nổi hoa văn thủ công, nung liên tục ở nhiệt độ 1.300°C trong lò bầu.',
      ArtisanStory:       'Do Nghệ nhân Ưu tú Trần Văn A chế tác từ ký ức đầm sen mùa hạ.',
      CulturalConnection: 'So với hoa sen mang tính thiền của Nhật, hoa sen Việt mang đậm nét đời thường, tươi sáng.',
    },
    model3d: {
      ModelUrl:    '',
      FiringTemp:  1300,
      Description: 'Mô hình 3D bình hoa men rạn Hoa Sen — Quy trình nung ở 1300°C trong lò bầu truyền thống.',
    },
  },

  SP002: {
    product: {
      ProductID:    'SP002',
      ProductName:  'Tượng Rồng phun nước men ngọc',
      Category:     'Gốm men ngọc',
      ThumbnailUrl: '',
      QrCodeUrl:    '',
      IsActive:     true,
    },
    culturalProfile: {
      IdentityLayer:      'Tượng Rồng phong cách thời Lý, cao 25cm, men ngọc celadon đặc trưng Bát Tràng.',
      SymbolismLayer:     'Rồng Việt tượng trưng cho sức mạnh, mưa thuận gió hòa và con cháu Lạc Hồng.',
      CraftsmanshipLayer: 'Tạo hình bằng khuôn thạch cao, chỉnh sửa thủ công, nung 2 lần ở 1250°C.',
      ArtisanStory:       'Nghệ nhân Nguyễn Thị B — thế hệ thứ 5 dòng họ gốm sứ, 40 năm theo nghề.',
      CulturalConnection: 'Khác với rồng phương Tây hung dữ, rồng Việt hiền hòa, gắn liền với nông nghiệp lúa nước.',
    },
    model3d: {
      ModelUrl:    '',
      FiringTemp:  1250,
      Description: 'Mô hình 3D tượng Rồng men ngọc — Kỹ thuật nung 2 lần tạo lớp men xanh ngọc.',
    },
  },
};

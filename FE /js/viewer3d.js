// viewer3d.js - Hien thi hanh trinh gom 5 giai doan (Three.js)

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const Viewer3D = (() => {
  let scene, camera, renderer, controls;
  let animationId = null;
  let containerEl = null;
  let initialized = false;

  // Du lieu 5 giai doan
  const STATIONS = [
    {
      id: 1, name: 'Khởi nguồn từ Đất', subtitle: 'Khu vực Nghiên cứu',
      color: 0xC4895A, hex: '#C4895A',
      desc: 'Mọi tác phẩm gốm đều bắt đầu từ đất. Đất sét trắng cao lanh từ Bát Tràng, đất phù sa đỏ từ Biên Hòa — mỗi loại đất mang linh hồn riêng.\n\nNgười thợ nhào nặn, loại bỏ tạp chất, ủ đất hàng tháng trời cho đạt độ dẻo mịn hoàn hảo. Công đoạn lọc đất quyết định 70% chất lượng thành phẩm.'
    },
    {
      id: 2, name: 'Bàn Xoay & Tạo Hình', subtitle: 'Khu vực Kiến trúc',
      color: 0xD4896E, hex: '#D4896E',
      desc: 'Đôi bàn tay nghệ nhân nhẹ nhàng vuốt phôi đất trên bàn xoay, từ khối đất vô tri hiện lên bình, chén, ấm.\n\nKỹ thuật vuốt tay truyền thống — mỗi sản phẩm là duy nhất, mang dấu vân tay người thợ. Bàn xoay quay đều 60–80 vòng/phút, đôi tay ướt nước giữ đất không nứt.'
    },
    {
      id: 3, name: 'Hồn Men & Họa Tiết', subtitle: 'Khu vực Mỹ thuật',
      color: 0x5BA88C, hex: '#5BA88C',
      desc: 'Men lam Huế thanh tao, men rạn Bát Tràng cổ kính, men ngọc Chu Đậu huyền bí.\n\nHoa văn vẽ tay kể chuyện tùng-cúc-trúc-mai, rồng-phượng. Nghệ nhân dùng bút lông vẽ trực tiếp lên phôi mộc — không phác thảo, mỗi nét bút là kinh nghiệm tích lũy hàng chục năm.'
    },
    {
      id: 4, name: 'Thử Lửa — Lò Nung', subtitle: 'Khu vực Kỹ thuật',
      color: 0xE8734A, hex: '#E8734A',
      desc: 'Lò nung rực cháy 1200–1300°C suốt 3 ngày đêm. Lửa biến đất thành sứ, men chảy thành lớp kính bóng.\n\nNgười thợ canh lửa, đọc màu khói, cảm nhiệt độ bằng kinh nghiệm truyền đời. Một mẻ nung hỏng là mất trắng cả tháng lao động.'
    },
    {
      id: 5, name: 'Thành Phẩm Hoàn Thiện', subtitle: 'Khu vực Kiểm định',
      color: 0xD4AA4F, hex: '#D4AA4F',
      desc: 'Sau khi lò nguội, tác phẩm gốm sứ lộ diện — lung linh dưới ánh sáng với men bóng mịn, hoa văn sắc nét.\n\nMỗi sản phẩm được kiểm tra: gõ nghe tiếng vang, soi men dưới nắng, đo độ đồng đều. Chỉ những tác phẩm hoàn hảo mới đến tay người thưởng thức.'
    }
  ];

  let stationGroups = [];
  let isMobile = false;

  // Chieu cao nav va chieu rong panel (responsive)
  const NAV_H = 56;      // px - nav luon o duoi
  const PANEL_W = 300;   // px - panel phai tren desktop

  function getViewport() {
    const parent = containerEl ? (containerEl.parentElement || containerEl) : null;
    const totalW = parent ? parent.clientWidth : window.innerWidth;
    const totalH = parent ? parent.clientHeight : window.innerHeight;
    const desktop = totalW >= 680;
    const cw = totalW;
    const ch = totalH - NAV_H;
    return { totalW, totalH, cw, ch, desktop };
  }

  let sheetOpen = false;
  let viewOff = { x: 0, y: 0 };
  let viewAnim = null;

  // Vung 3D con nhin thay duoc (tru phan bi sheet/panel che)
  function visibleRect() {
    const { cw, ch, desktop } = getViewport();
    let visW = cw, visH = ch;
    if (sheetOpen && uiRoot) {
      const sheet = uiRoot.querySelector('#v3d-sheet');
      if (desktop) visW = cw - PANEL_W - 24;
      else if (sheet) visH = ch - Math.min(sheet.offsetHeight, ch * 0.6);
    }
    return { W: cw, H: ch, visW, visH, desktop };
  }

  // Vi tri camera sao cho toan bo model + nhan nam gon trong vung nhin thay
  function fitView(stationId) {
    const r = visibleRect();
    const k = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const spanH = 7.5, spanW = 6.5;
    let d = Math.max(spanH * r.H / (r.visH * k), spanW * r.H / (r.visW * k), 11);
    d = Math.min(d, controls ? controls.maxDistance : 26);
    const target = new THREE.Vector3(0, 2.5, 0);
    const pos = target.clone().add(new THREE.Vector3(0.38, 0.4, 0.8).normalize().multiplyScalar(d));
    return { pos, target };
  }

  // Dich khung hinh de tam model nam giua vung nhin thay
  function applyView(animate) {
    if (!camera) return;
    if (viewAnim) cancelAnimationFrame(viewAnim);
    const r = visibleRect();
    const tx = (r.W - r.visW) / 2, ty = (r.H - r.visH) / 2;
    const fx = viewOff.x, fy = viewOff.y, start = performance.now(), dur = 450;
    function step(now) {
      const t = animate ? Math.min((now - start) / dur, 1) : 1;
      const e = 1 - Math.pow(1 - t, 3);
      viewOff.x = fx + (tx - fx) * e;
      viewOff.y = fy + (ty - fy) * e;
      camera.setViewOffset(r.W, r.H, viewOff.x, viewOff.y, r.W, r.H);
      viewAnim = t < 1 ? requestAnimationFrame(step) : null;
    }
    step(start);
  }

  function init(containerId, modelUrl, firingTemp) {
    if (initialized) return;
    containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    const { cw, ch } = getViewport();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8e4e0);
    scene.fog = new THREE.FogExp2(0xe8e4e0, isMobile ? 0.025 : 0.018);

    camera = new THREE.PerspectiveCamera(50, cw / ch, 0.1, 100);

    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
    renderer.setSize(cw, ch);
    renderer.setPixelRatio(dpr);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Canvas chi ve trong vung khong bi che (trai, phia tren nav)
    containerEl.style.cssText = 'position:absolute;top:0;left:0;overflow:hidden;';
    containerEl.style.width = cw + 'px';
    containerEl.style.height = ch + 'px';
    containerEl.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 5;
    controls.maxDistance = 26;
    const view = fitView();
    camera.position.copy(view.pos);
    controls.target.copy(view.target);
    applyView(false);
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

    setupLights();
    addFloor();

    if (modelUrl) {
      loadGLTF(modelUrl);
    } else {
      createProceduralPottery(firingTemp);
    }

    window.addEventListener('resize', onResize);
    initialized = true;
    animate();
  }

  // Anh sang — tong sang cho nen trang
  function setupLights() {
    // Anh sang deu tuyen doi - khong co huong, khong tao choi hay vung toi
    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
  }

  function addFloor() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70),
      new THREE.MeshStandardMaterial({ color: 0xd9d4ce, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(50, 30, 0xc9c3bb, 0xc9c3bb);
    grid.position.y = -0.48;
    scene.add(grid);
  }

  // Tai mo hinh GLTF/GLB
  function loadGLTF(url) {
    new GLTFLoader().load(url,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2.5 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y = 0;
        scene.add(model);
      },
      undefined,
      () => createProceduralPottery(1300)
    );
  }

  // ======================================================
  // Tao canh hanh trinh gom 5 giai doan
  // ======================================================
  function createProceduralPottery(firingTemp) {
    buildTextures();
    buildAllStations();
    buildUI();
    focusStation(1);
  }


  // --- Textures ---
  let TEX = null;

  function buildTextures() {
    TEX = {
      clay:    makeClayTexture('#8B6B4A', '60,40,20'),
      clayWet: makeClayTexture('#7A5C3E', '50,30,15'),
      wood:    makeWoodTexture(),
      brick:   makeBrickTexture(),
      glaze:   makeGlazeTexture()
    };
  }

  function makeClayTexture(base, variation) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = base;
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6000; i++) {
      const px = Math.random() * 256, py = Math.random() * 256;
      const a = Math.random() * 0.15;
      x.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      x.fillRect(px, py, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
    for (let i = 0; i < 20; i++) {
      x.strokeStyle = `rgba(${variation},${Math.random() * 0.08})`;
      x.lineWidth = Math.random() * 3 + 0.5;
      x.beginPath();
      x.moveTo(0, Math.random() * 256);
      x.bezierCurveTo(80, Math.random() * 256, 180, Math.random() * 256, 256, Math.random() * 256);
      x.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function makeWoodTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#3D2B1F';
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * 256;
      x.strokeStyle = `rgba(${30 + Math.random()*30},${15 + Math.random()*20},${10 + Math.random()*15},${Math.random()*0.4})`;
      x.lineWidth = Math.random() * 4 + 1;
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(256, y + (Math.random() - 0.5) * 10);
      x.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function makeBrickTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#4A2C1A';
    x.fillRect(0, 0, 256, 256);
    const bw = 40, bh = 18, gap = 3;
    for (let row = 0; row < 15; row++) {
      const offset = row % 2 === 0 ? 0 : bw / 2;
      for (let col = -1; col < 8; col++) {
        const bx = col * (bw + gap) + offset;
        const by = row * (bh + gap);
        const r = 90 + Math.random() * 40, g = 40 + Math.random() * 30, b = 20 + Math.random() * 20;
        x.fillStyle = `rgb(${r},${g},${b})`;
        x.fillRect(bx, by, bw, bh);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function makeGlazeTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const x = c.getContext('2d');
    const grad = x.createRadialGradient(256, 256, 50, 256, 256, 300);
    grad.addColorStop(0, '#2A7A65');
    grad.addColorStop(0.5, '#1E6B55');
    grad.addColorStop(1, '#165A48');
    x.fillStyle = grad;
    x.fillRect(0, 0, 512, 512);
    x.strokeStyle = 'rgba(200,220,255,0.2)'; x.lineWidth = 1.5;
    [100, 200, 310, 410].forEach(y => {
      x.beginPath(); x.moveTo(0, y); x.lineTo(512, y); x.stroke();
    });
    x.strokeStyle = 'rgba(180,200,240,0.18)'; x.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const fx = 60 + Math.random() * 400, fy = 120 + Math.random() * 280;
      for (let p = 0; p < 6; p++) {
        const angle = (Math.PI * 2 / 6) * p;
        x.beginPath();
        x.ellipse(fx + Math.cos(angle) * 12, fy + Math.sin(angle) * 12, 8, 5, angle, 0, Math.PI * 2);
        x.stroke();
      }
      x.beginPath(); x.arc(fx, fy, 3, 0, Math.PI * 2); x.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // --- Helpers ---
  function lathe(pts, segs = 32, mat) {
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, segs), mat);
    m.castShadow = true; return m;
  }
  function woodMat() {
    return new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: 0.85, metalness: 0.05 });
  }

  // --- Station builders ---

  function makeKaolinTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    // Nen xam xanh la nhat (cao lanh uot Bat Trang)
    x.fillStyle = '#8F8474';
    x.fillRect(0, 0, 256, 256);
    // Hat cat nho, tram tich nho li ti
    for (let i = 0; i < 4000; i++) {
      const a = Math.random() * 0.12;
      x.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(100,95,85,${a})`;
      x.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }
    // Vet vuot tay ngang (thay the van cu)
    for (let i = 0; i < 30; i++) {
      const y = Math.random() * 256;
      x.strokeStyle = Math.random() > 0.5
        ? `rgba(255,255,255,${Math.random() * 0.2})`
        : `rgba(140,130,115,${Math.random() * 0.14})`;
      x.lineWidth = Math.random() * 2.5 + 0.5;
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(256, y + (Math.random() - 0.5) * 3);
      x.stroke();
    }
    // Vung dam hon (dat uot ban tay de lai)
    for (let i = 0; i < 8; i++) {
      x.fillStyle = `rgba(160,152,138,${0.1 + Math.random() * 0.14})`;
      x.beginPath();
      x.ellipse(Math.random()*256, Math.random()*256, 15+Math.random()*30, 8+Math.random()*20, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }


  function buildStation1Detail() {
    const TABLE_H = 0.85, TOP_T = 0.1;
    const root = new THREE.Group();

    // Ban go rong
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(6.0, TOP_T, 3.0), woodMat());
    tableTop.position.y = TABLE_H + TOP_T / 2;
    tableTop.castShadow = true; tableTop.receiveShadow = true;
    root.add(tableTop);
    [[-2.7, -1.3], [2.7, -1.3], [-2.7, 1.3], [2.7, 1.3]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, TABLE_H, 0.18), woodMat());
      leg.position.set(lx, TABLE_H / 2, lz);
      leg.castShadow = true; root.add(leg);
    });

    // Dat cao lanh Bat Trang: trang xam nhat
    const kaolinTex = makeKaolinTexture();
    const clayMat = new THREE.MeshStandardMaterial({ map: kaolinTex, roughness: 0.95, metalness: 0, color: 0x8F8474 });

    // Khoi dat chinh: dang nui/non cut, day rong, thu dan len dinh vong
    const moundPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.52, 0),
      new THREE.Vector2(0.60, 0.04),
      new THREE.Vector2(0.63, 0.14),
      new THREE.Vector2(0.60, 0.3),
      new THREE.Vector2(0.54, 0.5),
      new THREE.Vector2(0.44, 0.72),
      new THREE.Vector2(0.32, 0.92),
      new THREE.Vector2(0.20, 1.06),
      new THREE.Vector2(0.10, 1.14),
      new THREE.Vector2(0.03, 1.18),
      new THREE.Vector2(0, 1.19),
    ];
    const clayBlock = new THREE.Mesh(new THREE.LatheGeometry(moundPts, 36), clayMat);
    clayBlock.position.set(-0.1, TABLE_H + TOP_T, 0.08);
    clayBlock.rotation.y = 0.4;
    clayBlock.castShadow = true; clayBlock.receiveShadow = true;
    root.add(clayBlock);

    // Mot it dat con lai ben canh
    [[0.6, 0.18, -0.5, 0.17, 0.75, 0.6], [-0.9, 0.12, 0.6, 0.14, 0.6, 0.65]].forEach(([x, y, z, r, sy, sz]) => {
      const lump = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), clayMat.clone());
      lump.scale.set(1, sy, sz);
      lump.position.set(x, TABLE_H + TOP_T + y, z);
      lump.castShadow = true; root.add(lump);
    });

    // Cuon dat (day dat)
    const coilCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.0, TABLE_H + TOP_T + 0.03, 0.9),
      new THREE.Vector3(-1.5, TABLE_H + TOP_T + 0.03, 1.1),
      new THREE.Vector3(-1.0, TABLE_H + TOP_T + 0.03, 1.0),
      new THREE.Vector3(-0.6, TABLE_H + TOP_T + 0.03, 0.8),
    ]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(coilCurve, 24, 0.07, 8, false), clayMat.clone()));

    // Lan cat dat
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xECE6DA, roughness: 0.5 }));
    roller.rotation.z = Math.PI / 2;
    roller.position.set(1.8, TABLE_H + TOP_T + 0.08, 0.6);
    roller.castShadow = true; root.add(roller);
    [-0.76, 0.76].forEach(rx => {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 10), woodMat());
      h.rotation.z = Math.PI / 2;
      h.position.set(1.8 + rx, TABLE_H + TOP_T + 0.08, 0.6);
      root.add(h);
    });

    // Khay nuoc
    const trayPts = [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.42, 0), new THREE.Vector2(0.46, 0.04),
      new THREE.Vector2(0.46, 0.22), new THREE.Vector2(0.42, 0.24), new THREE.Vector2(0.38, 0.22),
      new THREE.Vector2(0.38, 0.06), new THREE.Vector2(0, 0.06),
    ];
    const tray = lathe(trayPts, 20, new THREE.MeshStandardMaterial({ color: 0x5A4A3A, roughness: 0.8 }));
    tray.position.set(2.2, TABLE_H + TOP_T, -0.9);
    root.add(tray);
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(0.37, 20),
      new THREE.MeshStandardMaterial({ color: 0x4A7085, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.85 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(2.2, TABLE_H + TOP_T + 0.235, -0.9);
    root.add(water);

    return root;
  }



  function makeSlipClayTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#E3D9CA';
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * 256;
      x.strokeStyle = Math.random() > 0.5
        ? `rgba(255,255,255,${Math.random() * 0.35})`
        : `rgba(150,130,105,${Math.random() * 0.22})`;
      x.lineWidth = Math.random() * 2 + 0.5;
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(256, y + (Math.random() - 0.5) * 2);
      x.stroke();
    }
    for (let i = 0; i < 14; i++) {
      x.fillStyle = `rgba(140,115,90,${0.25 + Math.random() * 0.25})`;
      x.beginPath();
      x.ellipse(Math.random()*256, Math.random()*256, 5+Math.random()*12, 3+Math.random()*8, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }
    for (let i = 0; i < 8; i++) {
      const sx = Math.random() * 256, sy = Math.random() * 200;
      x.strokeStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.3})`;
      x.lineWidth = 3 + Math.random() * 4;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(sx, sy);
      x.lineTo(sx + (Math.random()-0.5)*12, sy + 20 + Math.random()*40);
      x.stroke();
    }
    for (let i = 0; i < 1500; i++) {
      x.fillStyle = `rgba(120,100,80,${Math.random() * 0.08})`;
      x.fillRect(Math.random()*256, Math.random()*256, 1.5, 1.5);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function makePanTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#6E8493';
    x.fillRect(0, 0, 256, 256);
    const blobs = ['rgba(125,145,160,0.28)', 'rgba(90,70,55,0.22)', 'rgba(205,190,165,0.38)'];
    for (let i = 0; i < 70; i++) {
      x.fillStyle = blobs[i % 3];
      x.beginPath();
      x.ellipse(Math.random()*256, Math.random()*256, 6+Math.random()*22, 4+Math.random()*14, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }
    for (let i = 0; i < 26; i++) {
      const sx = Math.random() * 256, sy = Math.random() * 200;
      x.strokeStyle = `rgba(138,110,85,${0.15 + Math.random() * 0.2})`;
      x.lineWidth = 1 + Math.random() * 3;
      x.beginPath();
      x.moveTo(sx, sy);
      x.lineTo(sx + (Math.random()-0.5)*6, sy + 30 + Math.random()*60);
      x.stroke();
    }
    for (let i = 0; i < 160; i++) {
      x.fillStyle = `rgba(215,205,185,${0.2 + Math.random() * 0.4})`;
      x.fillRect(Math.random()*256, Math.random()*256, 1+Math.random()*3, 1+Math.random()*3);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function buildStation2Detail() {
    const g = new THREE.Group();
    const TABLE_H = 0.9, TOP_T = 0.12;
    g.position.y = TABLE_H + TOP_T;
    const root = new THREE.Group();
    root.add(g);
    const spin = new THREE.Group();
    g.add(spin);

    const slipTex = makeSlipClayTexture();

    // Chau hung nuoc/dat
    const panMat = new THREE.MeshStandardMaterial({ map: makePanTexture(), roughness: 0.88, metalness: 0.05, side: THREE.DoubleSide });
    const panPts = [
      new THREE.Vector2(0, 0.12), new THREE.Vector2(1.2, 0.12), new THREE.Vector2(1.36, 0.18),
      new THREE.Vector2(1.48, 0.4), new THREE.Vector2(1.52, 0.56), new THREE.Vector2(1.58, 0.6),
      new THREE.Vector2(1.66, 0.56), new THREE.Vector2(1.64, 0.4), new THREE.Vector2(1.5, 0.14),
      new THREE.Vector2(1.3, 0.04), new THREE.Vector2(0, 0.04),
    ];
    const pan = lathe(panPts, 48, panMat);
    pan.position.y = 0.25;
    pan.receiveShadow = true;
    g.add(pan);

    [0, 1, 2].forEach(i => {
      const a = i * Math.PI * 2 / 3 + 0.5;
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.27, 12), panMat);
      foot.position.set(Math.cos(a) * 1.05, 0.135, Math.sin(a) * 1.05);
      foot.castShadow = true; g.add(foot);
    });

    const slurry = new THREE.Mesh(
      new THREE.CircleGeometry(1.3, 40),
      new THREE.MeshStandardMaterial({ color: 0xA89478, roughness: 0.3, metalness: 0.05 })
    );
    slurry.rotation.x = -Math.PI / 2;
    slurry.position.y = 0.38;
    g.add(slurry);

    // Truc ban xoay
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.38, 20),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.6 })
    );
    shaft.position.y = 0.55;
    spin.add(shaft);

    // Dau ban xoay
    const wheelPts = [
      new THREE.Vector2(0, 0.7), new THREE.Vector2(1.0, 0.7), new THREE.Vector2(1.06, 0.72),
      new THREE.Vector2(1.06, 0.8), new THREE.Vector2(1.0, 0.82), new THREE.Vector2(0.9, 0.83),
      new THREE.Vector2(0.85, 0.84), new THREE.Vector2(0.8, 0.83), new THREE.Vector2(0.7, 0.84),
      new THREE.Vector2(0.65, 0.83), new THREE.Vector2(0.55, 0.84), new THREE.Vector2(0.5, 0.83),
      new THREE.Vector2(0.4, 0.84), new THREE.Vector2(0.3, 0.83), new THREE.Vector2(0, 0.84),
    ];
    const wheelHead = lathe(wheelPts, 48, new THREE.MeshStandardMaterial({ map: slipTex, roughness: 0.5, side: THREE.DoubleSide }));
    wheelHead.receiveShadow = true;
    spin.add(wheelHead);

    // Phoi binh
    const wall = new THREE.SplineCurve([
      new THREE.Vector2(0.52, 0), new THREE.Vector2(0.58, 0.04), new THREE.Vector2(0.64, 0.16),
      new THREE.Vector2(0.68, 0.34), new THREE.Vector2(0.67, 0.52), new THREE.Vector2(0.6, 0.7),
      new THREE.Vector2(0.5, 0.88), new THREE.Vector2(0.4, 1.02), new THREE.Vector2(0.33, 1.14),
      new THREE.Vector2(0.3, 1.26), new THREE.Vector2(0.32, 1.38), new THREE.Vector2(0.38, 1.47),
      new THREE.Vector2(0.43, 1.52), new THREE.Vector2(0.4, 1.57), new THREE.Vector2(0.34, 1.58),
      new THREE.Vector2(0.27, 1.55),
    ]).getPoints(80);
    const outerPts = [new THREE.Vector2(0, 0)].concat(wall);
    const vesselMat = new THREE.MeshStandardMaterial({ map: slipTex, color: 0x8F8474, roughness: 0.55, metalness: 0, side: THREE.DoubleSide });
    const vessel = lathe(outerPts, 56, vesselMat);
    vessel.position.y = 0.84;
    spin.add(vessel);

    const innerPts = [
      new THREE.Vector2(0.26, 1.54), new THREE.Vector2(0.2, 1.4), new THREE.Vector2(0.18, 1.25),
      new THREE.Vector2(0.2, 1.1), new THREE.Vector2(0.3, 0.9), new THREE.Vector2(0.42, 0.7),
      new THREE.Vector2(0.5, 0.5), new THREE.Vector2(0.5, 0.25), new THREE.Vector2(0.3, 0.14),
      new THREE.Vector2(0, 0.12),
    ];
    const inner = lathe(innerPts, 40, new THREE.MeshStandardMaterial({ color: 0x8F8474, roughness: 0.8, side: THREE.DoubleSide }));
    inner.position.y = 0.84;
    spin.add(inner);

    // Lo dat nung dung dung cu
    const potMat = new THREE.MeshStandardMaterial({ color: 0xB5603A, roughness: 0.9, side: THREE.DoubleSide });
    const potPts = [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.24, 0), new THREE.Vector2(0.28, 0.05),
      new THREE.Vector2(0.32, 0.4), new THREE.Vector2(0.34, 0.68), new THREE.Vector2(0.37, 0.72),
      new THREE.Vector2(0.37, 0.66), new THREE.Vector2(0.3, 0.68), new THREE.Vector2(0.28, 0.1),
      new THREE.Vector2(0, 0.08),
    ];
    const toolPot = lathe(potPts, 24, potMat);
    toolPot.position.set(2.35, 0, 0.3);
    g.add(toolPot);

    const toolMat = new THREE.MeshStandardMaterial({ color: 0xC49A6A, roughness: 0.8 });
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      const tilt = 0.15 + (i % 3) * 0.08;
      const len = 0.8 + (i % 3) * 0.15;
      const dir = new THREE.Vector3(Math.sin(tilt)*Math.cos(a), Math.cos(tilt), Math.sin(tilt)*Math.sin(a));
      const base = new THREE.Vector3(Math.cos(a)*0.12, 0.1, Math.sin(a)*0.12);
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.022, len, 6),
        i === 5 ? new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 }) : toolMat
      );
      stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      stick.position.copy(base).add(dir.clone().multiplyScalar(len / 2)).add(new THREE.Vector3(2.35, 0, 0.3));
      stick.castShadow = true; g.add(stick);
      if (i === 0) {
        const sponge = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0xE8C547, roughness: 1 }));
        sponge.position.copy(stick.position).add(dir.clone().multiplyScalar(len/2 + 0.06));
        g.add(sponge);
      }
    }

    // Bat gom nau sam
    const bowlPts = [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.2, 0), new THREE.Vector2(0.25, 0.03),
      new THREE.Vector2(0.4, 0.14), new THREE.Vector2(0.5, 0.28), new THREE.Vector2(0.49, 0.29),
      new THREE.Vector2(0.44, 0.26), new THREE.Vector2(0.3, 0.12), new THREE.Vector2(0, 0.07),
    ];
    const bowl = lathe(bowlPts, 32, new THREE.MeshStandardMaterial({ color: 0x4A3426, roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide }));
    bowl.position.set(-2.25, 0, 0.6);
    g.add(bowl);

    // Ban go
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(5.8, TOP_T, 3.5), woodMat());
    tableTop.position.y = TABLE_H + TOP_T / 2;
    tableTop.castShadow = true; tableTop.receiveShadow = true;
    root.add(tableTop);
    [[-2.6, -1.5], [2.6, -1.5], [-2.6, 1.5], [2.6, 1.5]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, TABLE_H, 0.2), woodMat());
      leg.position.set(lx, TABLE_H/2, lz);
      leg.castShadow = true; root.add(leg);
    });
    [[-2.6, 0, 0.1, 2.8], [2.6, 0, 0.1, 2.8]].forEach(([bx, bz, bw, bd]) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.1, bd), woodMat());
      rail.position.set(bx, TABLE_H - 0.05, bz); root.add(rail);
    });

    root.userData.spinPart = spin;
    return root;
  }


  function buildStation1() {
    const g = new THREE.Group();

    // Wooden workbench
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 2), woodMat());
    tableTop.position.y = 1.1;
    tableTop.castShadow = true;
    g.add(tableTop);
    [[-1.4, 0, -0.8], [1.4, 0, -0.8], [-1.4, 0, 0.8], [1.4, 0, 0.8]].forEach(p => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), woodMat());
      leg.position.set(p[0], 0.55, p[2]);
      g.add(leg);
    });

    // Clay
    const clayMat = new THREE.MeshStandardMaterial({ map: TEX.clay, roughness: 0.92, metalness: 0 });
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.7), clayMat);
    block.position.set(-0.5, 1.46, 0);
    block.rotation.y = 0.2;
    block.castShadow = true;
    g.add(block);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), clayMat.clone());
    ball.position.set(0.6, 1.46, -0.3);
    ball.scale.y = 0.75;
    ball.castShadow = true;
    g.add(ball);

    const coilCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.3, 1.22, 0.5),
      new THREE.Vector3(0.7, 1.22, 0.6),
      new THREE.Vector3(1.0, 1.22, 0.3),
      new THREE.Vector3(0.8, 1.22, 0.0),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(coilCurve, 20, 0.06, 8, false), clayMat.clone()));

    // Water basin
    const basin = lathe([
      new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0),
      new THREE.Vector2(0.55, 0.05), new THREE.Vector2(0.55, 0.35),
      new THREE.Vector2(0.5, 0.38), new THREE.Vector2(0.45, 0.35),
      new THREE.Vector2(0.45, 0.06), new THREE.Vector2(0.0, 0.06),
    ], 20, new THREE.MeshStandardMaterial({ color: 0x5A4A3A, roughness: 0.8 }));
    basin.position.set(1.8, 0.15, 0);
    g.add(basin);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 20),
      new THREE.MeshStandardMaterial({ color: 0x4A6A7A, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.8 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(1.8, 0.48, 0);
    g.add(water);

    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), new THREE.MeshBasicMaterial({ color: 0x888888 }));
    wire.position.set(-1.2, 1.22, 0.2);
    wire.rotation.z = Math.PI / 2;
    g.add(wire);

    const slab = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.7), clayMat.clone());
    slab.position.set(-1.8, 0.15, 1);
    slab.castShadow = true;
    g.add(slab);

    return g;
  }

  function buildStation2() {
    const g = new THREE.Group();
    const wMat = woodMat();

    // Wheel stand / pedestal
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.9, 16), wMat);
    stand.position.y = 0.6;
    stand.castShadow = true;
    g.add(stand);

    // Flywheel
    const flywheel = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.08, 32),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.6 })
    );
    flywheel.position.y = 0.2;
    g.add(flywheel);

    // Wheel head
    const wheelHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.06, 32),
      new THREE.MeshStandardMaterial({ map: TEX.clayWet, roughness: 0.7 })
    );
    wheelHead.position.y = 1.08;
    g.add(wheelHead);

    // Pot being formed
    const potMat = new THREE.MeshStandardMaterial({ map: TEX.clayWet, roughness: 0.85, metalness: 0 });
    const potPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.55, 0),
      new THREE.Vector2(0.62, 0.06),
      new THREE.Vector2(0.68, 0.2),
      new THREE.Vector2(0.72, 0.4),
      new THREE.Vector2(0.73, 0.55),
      new THREE.Vector2(0.70, 0.7),
      new THREE.Vector2(0.65, 0.85),
      new THREE.Vector2(0.58, 1.0),
      new THREE.Vector2(0.50, 1.12),
      new THREE.Vector2(0.44, 1.2),
      new THREE.Vector2(0.40, 1.28),
      new THREE.Vector2(0.38, 1.32),
      new THREE.Vector2(0.40, 1.36),
    ];
    const pot = lathe(potPts, 28, potMat);
    pot.position.y = 1.11;
    g.add(pot);

    // Throwing rings
    [0.3, 0.55, 0.8, 1.05].forEach(y => {
      const r = potPts.reduce((c, p) => Math.abs(p.y - y) < Math.abs(c.y - y) ? p : c).x;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.012, 6, 28),
        new THREE.MeshStandardMaterial({ color: 0x6A5040, roughness: 0.9 })
      );
      ring.position.y = y + 1.11;
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
    });

    // Water bowl
    const bowlPts = [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.25, 0),
      new THREE.Vector2(0.3, 0.04), new THREE.Vector2(0.32, 0.12),
      new THREE.Vector2(0.3, 0.18), new THREE.Vector2(0.25, 0.16),
      new THREE.Vector2(0.25, 0.05), new THREE.Vector2(0, 0.05),
    ];
    const bowl = lathe(bowlPts, 16, new THREE.MeshStandardMaterial({ color: 0x7A6A5A, roughness: 0.7 }));
    bowl.position.set(1.6, 0.15, 0.8);
    g.add(bowl);

    const sponge = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xC4A848, roughness: 1 })
    );
    sponge.position.set(1.7, 0.28, 0.5);
    sponge.scale.y = 0.6;
    g.add(sponge);

    // Wooden stool
    const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 12), wMat);
    stoolTop.position.set(-1.5, 0.6, 1.2);
    g.add(stoolTop);
    [[-0.2, 0, -0.2], [0.2, 0, -0.2], [0, 0, 0.25]].forEach(p => {
      const sLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), wMat);
      sLeg.position.set(-1.5 + p[0], 0.3, 1.2 + p[2]);
      g.add(sLeg);
    });

    g.userData.spinning = true;
    return g;
  }

  function buildStation3() {
    const g = new THREE.Group();

    // Workbench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 1.8), woodMat());
    bench.position.y = 1.0;
    bench.castShadow = true;
    g.add(bench);
    [[-1.6, 0.5, -0.75], [1.6, 0.5, -0.75], [-1.6, 0.5, 0.75], [1.6, 0.5, 0.75]].forEach(p => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.08), woodMat());
      l.position.set(...p);
      g.add(l);
    });

    // Main vase with glaze
    const vasePts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.48, 0),
      new THREE.Vector2(0.58, 0.08),
      new THREE.Vector2(0.68, 0.25),
      new THREE.Vector2(0.76, 0.5),
      new THREE.Vector2(0.80, 0.8),
      new THREE.Vector2(0.78, 1.1),
      new THREE.Vector2(0.70, 1.35),
      new THREE.Vector2(0.58, 1.6),
      new THREE.Vector2(0.42, 1.85),
      new THREE.Vector2(0.30, 2.05),
      new THREE.Vector2(0.25, 2.2),
      new THREE.Vector2(0.23, 2.35),
      new THREE.Vector2(0.28, 2.48),
      new THREE.Vector2(0.34, 2.55),
      new THREE.Vector2(0.32, 2.6),
    ];
    const vase = lathe(vasePts, 36, new THREE.MeshStandardMaterial({ map: TEX.glaze, roughness: 0.25, metalness: 0.12, side: THREE.DoubleSide }));
    vase.position.set(0, 1.07, 0);
    g.add(vase);
    // Day binh ben trong: tranh nhin xuyen khi camera tu tren
    const innerBase = new THREE.Mesh(
      new THREE.CircleGeometry(0.47, 36),
      new THREE.MeshStandardMaterial({ map: TEX.glaze, roughness: 0.5, metalness: 0.08 })
    );
    innerBase.rotation.x = -Math.PI / 2;
    innerBase.position.set(0, 1.072, 0);
    g.add(innerBase);

    // Paint bowls with glaze colors
    const glazeColors = [0x1A4A8A, 0x8B2500, 0x2E6B4A, 0xC49A3C, 0xEEEEDD];
    const bowlXs = [-1.2, -0.7, -0.2, 0.3, 0.8];
    glazeColors.forEach((col, i) => {
      const bPts = [
        new THREE.Vector2(0, 0), new THREE.Vector2(0.14, 0),
        new THREE.Vector2(0.16, 0.02), new THREE.Vector2(0.17, 0.08),
        new THREE.Vector2(0.15, 0.1),
      ];
      const b = lathe(bPts, 12, new THREE.MeshStandardMaterial({ color: 0x6A5A4A, roughness: 0.8 }));
      b.position.set(bowlXs[i], 1.05, -0.65);
      g.add(b);
      const paint = new THREE.Mesh(
        new THREE.CircleGeometry(0.13, 12),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.1 })
      );
      paint.rotation.x = -Math.PI / 2;
      paint.position.set(bowlXs[i], 1.13, -0.65);
      g.add(paint);
    });

    // Brushes
    [0x4A3020, 0x3A2515, 0x5A4030].forEach((col, i) => {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.025, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 })
      );
      handle.position.set(1.2 + i * 0.15, 1.12, -0.4);
      handle.rotation.z = Math.PI / 2 + 0.1;
      handle.rotation.x = 0.3 * (i - 1);
      g.add(handle);
      const bristle = new THREE.Mesh(
        new THREE.ConeGeometry(0.035 - i * 0.008, 0.15, 8),
        new THREE.MeshStandardMaterial({ color: 0x2A2015 })
      );
      bristle.position.set(1.2 + i * 0.15 + 0.38, 1.12, -0.4);
      bristle.rotation.z = Math.PI / 2;
      g.add(bristle);
    });

    // But long thu phap: than tre, dau long thuon, nghieng 40 do cham vao than binh
    const paintingBrush = new THREE.Group();
    // Than but: tre vang, thuon dai
    const pbSegments = 5;
    for (let si = 0; si < pbSegments; si++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013 - si * 0.0005, 0.015 - si * 0.0005, 0.22, 7),
        new THREE.MeshStandardMaterial({ color: si % 2 === 0 ? 0xC8A84B : 0xB89A3A, roughness: 0.5 })
      );
      seg.position.y = 0.11 + si * 0.22;
      paintingBrush.add(seg);
    }
    // Vong buoc long (kim loai nho)
    const pbBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.7 })
    );
    pbBand.position.y = -0.02;
    paintingBrush.add(pbBand);
    // Phan long: thuon nhu but long thư phap, dai hon
    const pbFerrule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.022, 0.08, 10),
      new THREE.MeshStandardMaterial({ color: 0x1A1208, roughness: 0.85 })
    );
    pbFerrule.position.y = -0.07;
    paintingBrush.add(pbFerrule);
    const pbTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.022, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: 0x0D0C08, roughness: 0.9 })
    );
    pbTip.position.y = -0.21;
    paintingBrush.add(pbTip);
    // Diem trang: giot muc xanh cobalt dau long, dang cham vao binh
    const pbDrop = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x1A3080, roughness: 0.3, metalness: 0.15 })
    );
    pbDrop.position.y = -0.325;
    paintingBrush.add(pbDrop);
    // But nghieng ~42 do, dau long cham vao than binh tai do cao y~2.15
    // Binh co ban kinh ~0.73 tai y tuong doi ~1.0 -> trong group: x=0.73, y=2.15
    paintingBrush.rotation.z = -Math.PI / 4.2;
    paintingBrush.position.set(0.68, 2.52, 0.18);
    g.add(paintingBrush);
    g.userData.paintingBrush = paintingBrush;

    // Hoa van muc xanh cobalt da ve tren than binh (vet but thu phap)
    const inkMat = new THREE.MeshStandardMaterial({ color: 0x1A3080, roughness: 0.35, metalness: 0.1 });
    // Cac net but: nhung vong cung mo phong ky tu Hán/hoa van gom
    const strokeDefs = [
      { rx: 0.74, y: 2.05, z: 0.0,   rx2: 0,    rz: 0.0,  sx: 0.18, sy: 0.012, sz: 0.012 },
      { rx: 0.73, y: 1.95, z: 0.08,  rx2: 0.12, rz: 0.1,  sx: 0.12, sy: 0.012, sz: 0.012 },
      { rx: 0.70, y: 2.18, z: -0.05, rx2: -0.1, rz: -0.08,sx: 0.1,  sy: 0.012, sz: 0.012 },
      { rx: 0.72, y: 2.08, z: 0.14,  rx2: 0.2,  rz: 0.05, sx: 0.08, sy: 0.010, sz: 0.010 },
    ];
    strokeDefs.forEach(s => {
      const stroke = new THREE.Mesh(new THREE.BoxGeometry(s.sx, s.sy, s.sz), inkMat);
      stroke.position.set(s.rx, s.y, s.z);
      stroke.rotation.set(s.rx2, 0, s.rz);
      g.add(stroke);
    });

    // Unglazed bowl (work in progress)
    const rawBowlPts = [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.35, 0),
      new THREE.Vector2(0.42, 0.06), new THREE.Vector2(0.45, 0.2),
      new THREE.Vector2(0.42, 0.28), new THREE.Vector2(0.38, 0.25),
      new THREE.Vector2(0.38, 0.07), new THREE.Vector2(0, 0.07),
    ];
    const rawBowl = lathe(rawBowlPts, 16, new THREE.MeshStandardMaterial({ map: TEX.clay, roughness: 0.9 }));
    rawBowl.position.set(-1.3, 1.05, 0.4);
    g.add(rawBowl);

    return g;
  }

  function buildStation4() {
    const g = new THREE.Group();
    const brickMat = new THREE.MeshStandardMaterial({ map: TEX.brick, roughness: 0.9 });

    // Kiln body
    const kilnBody = new THREE.Mesh(new THREE.CapsuleGeometry(1.2, 1.5, 12, 16), brickMat);
    kilnBody.rotation.z = Math.PI / 2;
    kilnBody.position.set(0, 1.2, 0);
    kilnBody.scale.set(1, 0.85, 1);
    kilnBody.castShadow = true;
    g.add(kilnBody);

    const kilnBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 2.6), brickMat.clone());
    kilnBase.position.y = 0.3;
    kilnBase.castShadow = true;
    g.add(kilnBase);

    // Arch opening
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 8, 12, Math.PI), brickMat.clone());
    arch.position.set(0, 0.75, 1.32);
    arch.rotation.y = Math.PI;
    g.add(arch);

    // Fire glow
    const fire = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xFF4500, transparent: true, opacity: 0.85 })
    );
    fire.position.set(0, 0.7, 1.3);
    g.add(fire);
    g.userData.fireMesh = fire;

    const fireLight = new THREE.PointLight(0xFF4500, 2.5, 8);
    fireLight.position.set(0, 0.7, 1.5);
    g.add(fireLight);
    g.userData.fireLight = fireLight;

    // Chimney
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 12), brickMat.clone());
    chimney.position.set(-0.8, 2.3, 0);
    chimney.castShadow = true;
    g.add(chimney);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.18, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 })
    );
    cap.position.set(-0.8, 3.04, 0);
    g.add(cap);

    // Firewood stack
    for (let i = 0; i < 6; i++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.9 + (i % 3) * 0.1, 8),
        woodMat()
      );
      log.position.set(2.2, 0.22 + Math.floor(i / 3) * 0.16, -0.6 + (i % 3) * 0.2);
      log.rotation.z = Math.PI / 2;
      g.add(log);
    }

    // Small pots inside kiln
    for (let i = 0; i < 3; i++) {
      const miniPts = [
        new THREE.Vector2(0, 0), new THREE.Vector2(0.15, 0),
        new THREE.Vector2(0.18, 0.05), new THREE.Vector2(0.18, 0.2),
        new THREE.Vector2(0.15, 0.25),
      ];
      const mini = lathe(miniPts, 10, new THREE.MeshStandardMaterial({
        color: 0xCC8855, roughness: 0.7, emissive: 0xFF4400, emissiveIntensity: 0.15
      }));
      mini.position.set(-0.3 + i * 0.3, 0.45, 0.5);
      g.add(mini);
    }

    // Temperature display
    const tc = document.createElement('canvas');
    tc.width = 200; tc.height = 64;
    const tx = tc.getContext('2d');
    tx.fillStyle = '#FF4500';
    tx.font = 'bold 36px monospace';
    tx.textAlign = 'center';
    tx.fillText('1300\u00b0C', 100, 44);
    const tempSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tc), transparent: true }));
    tempSprite.scale.set(2, 0.65, 1);
    tempSprite.position.set(0, 3.5, 0);
    g.add(tempSprite);

    // Smoke particles
    const smokeGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(20 * 3);
    for (let i = 0; i < 20; i++) {
      sPos[i * 3]     = -0.8 + (Math.random() - 0.5) * 0.3;
      sPos[i * 3 + 1] = 3 + Math.random() * 2;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const smoke = new THREE.Points(smokeGeo, new THREE.PointsMaterial({
      color: 0x888888, size: 0.15, transparent: true, opacity: 0.3, sizeAttenuation: true
    }));
    g.add(smoke);
    g.userData.smoke = smoke;

    return g;
  }

  function buildStation5() {
    const g = new THREE.Group();

    // Display pedestal
    const pedBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.1, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0x1A1816, roughness: 0.4, metalness: 0.3 })
    );
    pedBase.position.y = 0.22;
    pedBase.castShadow = true;
    g.add(pedBase);

    const pedCol = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.7, 16),
      new THREE.MeshStandardMaterial({ color: 0x2A2520, roughness: 0.5, metalness: 0.2 })
    );
    pedCol.position.y = 0.65;
    g.add(pedCol);

    const pedTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.7, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0x1A1816, roughness: 0.3, metalness: 0.4 })
    );
    pedTop.position.y = 1.04;
    g.add(pedTop);

    // Gold rim
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xD4AA4F, metalness: 0.8, roughness: 0.2, emissive: 0xD4AA4F, emissiveIntensity: 0.15 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.02, 8, 32), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.08;
    g.add(rim);

    // Masterpiece vase
    const mvPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.42, 0),
      new THREE.Vector2(0.50, 0.05),
      new THREE.Vector2(0.58, 0.15),
      new THREE.Vector2(0.66, 0.3),
      new THREE.Vector2(0.74, 0.5),
      new THREE.Vector2(0.80, 0.7),
      new THREE.Vector2(0.82, 0.9),
      new THREE.Vector2(0.80, 1.1),
      new THREE.Vector2(0.76, 1.3),
      new THREE.Vector2(0.68, 1.5),
      new THREE.Vector2(0.56, 1.7),
      new THREE.Vector2(0.42, 1.9),
      new THREE.Vector2(0.32, 2.05),
      new THREE.Vector2(0.25, 2.2),
      new THREE.Vector2(0.22, 2.35),
      new THREE.Vector2(0.21, 2.48),
      new THREE.Vector2(0.24, 2.58),
      new THREE.Vector2(0.30, 2.68),
      new THREE.Vector2(0.35, 2.74),
      new THREE.Vector2(0.33, 2.78),
    ];
    const masterVase = lathe(mvPts, 48, new THREE.MeshStandardMaterial({ map: TEX.glaze, roughness: 0.12, metalness: 0.18 }));
    masterVase.position.y = 1.08;
    g.add(masterVase);
    g.userData.masterVase = masterVase;

    // Gold bands on vase
    [0.35, 0.9, 1.5, 2.2, 2.7].forEach(y => {
      const r = mvPts.reduce((c, p) => Math.abs(p.y - y) < Math.abs(c.y - y) ? p : c).x;
      const band = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 48), rimMat.clone());
      band.position.y = y + 1.08;
      band.rotation.x = Math.PI / 2;
      g.add(band);
    });

    // Spotlight
    const spot = new THREE.SpotLight(0xfff0dd, 4, 12, Math.PI / 5, 0.6, 1);
    spot.position.set(0, 7, 0);
    spot.target.position.set(0, 1.5, 0);
    g.add(spot);
    g.add(spot.target);

    // Side display: teacup
    const cupPts = [
      new THREE.Vector2(0, 0), new THREE.Vector2(0.2, 0),
      new THREE.Vector2(0.25, 0.04), new THREE.Vector2(0.28, 0.15),
      new THREE.Vector2(0.26, 0.22), new THREE.Vector2(0.22, 0.2),
      new THREE.Vector2(0.22, 0.05), new THREE.Vector2(0, 0.05),
    ];
    const cup = lathe(cupPts, 16, new THREE.MeshStandardMaterial({ color: 0xEEEEDD, roughness: 0.2, metalness: 0.1 }));
    cup.position.set(2, 0.15, -0.5);
    g.add(cup);

    // Small plate
    const plate = lathe([
      new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0),
      new THREE.Vector2(0.55, 0.03), new THREE.Vector2(0.55, 0.05),
      new THREE.Vector2(0.5, 0.06),
    ], 20, new THREE.MeshStandardMaterial({ color: 0xEEEEDD, roughness: 0.2, metalness: 0.1 }));
    plate.position.set(2, 0.15, 0.5);
    g.add(plate);

    g.userData.rotate = true;
    return g;
  }


  // --- Build scene ---
  function buildAllStations() {
    const builders = [buildStation1Detail, buildStation2Detail, buildStation3, buildStation4, buildStation5];
    stationGroups = [];
    STATIONS.forEach((st, i) => {
      const group = new THREE.Group();
      const pw = 9, pd = 7;
      const base = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.25, pd), new THREE.MeshStandardMaterial({ color: 0xf1ede7, roughness: 0.8, metalness: 0.15 }));
      base.receiveShadow = true; group.add(base);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(pw, 0.25, pd)), new THREE.LineBasicMaterial({ color: st.color, transparent: true, opacity: 0.5 }));
      group.add(edges); group.userData.edges = edges;
      const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 200;
      const lx = lc.getContext('2d');
      lx.fillStyle = '#ffffff'; lx.roundRect(10, 10, 1004, 180, 16); lx.fill();
      lx.strokeStyle = st.hex; lx.lineWidth = 6; lx.roundRect(10, 10, 1004, 180, 16); lx.stroke();
      lx.fillStyle = '#1a1a1a'; lx.font = 'bold 72px sans-serif'; lx.textAlign = 'center'; lx.fillText(st.name, 512, 92);
      lx.fillStyle = '#444'; lx.font = '44px sans-serif'; lx.fillText(st.subtitle, 512, 152);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(lc), transparent: true, depthTest: false }));
      label.scale.set(4.4, 0.86, 1); label.position.set(0, 5.5, 0); label.renderOrder = 1; group.add(label);
      let pottery;
      if (i === 0) {
        // Station 1: load model1.glb thay vi procedural
        pottery = new THREE.Group();
        new GLTFLoader().load(
          'model/model1.glb',
          (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const scale = 3.5 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            model.position.y += size.y * scale / 2;
            pottery.add(model);
          },
          undefined,
          (err) => {
            console.warn('model1.glb load failed, fallback to procedural', err);
            const fb = buildStation1Detail();
            pottery.add(fb);
          }
        );
      } else if (i === 1) {
        // Station 2: load model2.glb thay vi procedural
        pottery = new THREE.Group();
        new GLTFLoader().load(
          'model/model2.glb',
          (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const scale = 3.5 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            model.position.y += size.y * scale / 2;
            pottery.add(model);
          },
          undefined,
          (err) => {
            console.warn('model2.glb load failed, fallback to procedural', err);
            const fb = buildStation2Detail();
            pottery.add(fb);
          }
        );
      } else {
        pottery = builders[i]();
      }
      pottery.position.y += 0.13; group.add(pottery); group.userData.pottery = pottery;
      group.add(new THREE.PointLight(st.color, 0.4, 12).translateY(3));
      group.visible = false;
      scene.add(group);
      stationGroups.push(group);
    });
  }

  // --- UI tao dong ---
  let uiRoot = null;

  function buildUI() {
    const parent = containerEl.parentElement || containerEl;
    parent.style.position = 'relative';
    parent.style.overflow = 'hidden';

    // An overlay cu cua Sang de tranh chong cheo
    const oldTop = parent.querySelector('.viewer3d-overlay-top');
    const oldBot = parent.querySelector('.viewer3d-overlay-bottom');
    if (oldTop) oldTop.style.display = 'none';
    if (oldBot) oldBot.style.display = 'none';
    const oldDesc = parent.parentElement?.querySelector('.viewer3d-desc');
    if (oldDesc) oldDesc.style.display = 'none';

    uiRoot = document.createElement('div');
    uiRoot.id = 'v3d-ui';
    uiRoot.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:inherit;z-index:4;';
    uiRoot.innerHTML = buildUIHTML();
    parent.appendChild(uiRoot);

    uiRoot.querySelector('#v3d-close').addEventListener('click', closePanel);

    const sheet = uiRoot.querySelector('#v3d-sheet');
    let touchY = 0;
    sheet.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchend', e => { if (e.changedTouches[0].clientY - touchY > 50) closePanel(); });

    const nav = uiRoot.querySelector('#v3d-nav');
    STATIONS.forEach((st, i) => {
      if (i > 0) {
        const conn = document.createElement('div');
        conn.style.cssText = 'flex:1;height:2px;background:#ebebeb;position:relative;min-width:4px;';
        conn.innerHTML = `<div id="v3d-conn-${i}" style="position:absolute;inset:0;width:0%;background:#b8864a;transition:width 0.5s;"></div>`;
        nav.appendChild(conn);
      }
      const btn = document.createElement('div');
      btn.id = `v3d-node-${i}`;
      btn.textContent = st.id;
      btn.title = st.name;
      btn.style.cssText = `width:38px;height:38px;border-radius:50%;border:2px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;cursor:pointer;color:${st.hex};background:#fff;flex-shrink:0;transition:all 0.25s;`;
      btn.addEventListener('click', () => focusStation(st.id));
      nav.appendChild(btn);
    });

    // Sau khi inject UI, dong bo lai kich thuoc canvas voi layout thuc te
    setTimeout(onResize, 50);
  }

  function buildUIHTML() {
    const { totalW, desktop } = getViewport();
    if (desktop) {
      // Desktop: panel ben phai, nav duoi
      return `
        <div id="v3d-sheet" style="
          position:absolute;top:12px;right:12px;bottom:${NAV_H + 12}px;
          width:${PANEL_W}px;
          background:rgba(255,255,255,0.97);
          border:1px solid #e0e0e0;border-radius:12px;
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          transform:translateX(${PANEL_W + 20}px);
          transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);
          display:flex;flex-direction:column;
          pointer-events:all;
          box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="display:flex;align-items:center;gap:10px;padding:14px 14px 6px;flex-shrink:0;">
            <div id="v3d-badge" style="padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:1px;flex-shrink:0;"></div>
            <div id="v3d-title" style="font-size:14px;font-weight:600;line-height:1.3;flex:1;color:#1a1a1a;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
            <button id="v3d-close" style="background:#f0f0f0;border:none;color:#888;font-size:14px;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;pointer-events:all;">✕</button>
          </div>
          <div id="v3d-sub" style="padding:0 14px 6px;font-size:11px;color:#aaa;flex-shrink:0;"></div>
          <div id="v3d-desc" style="padding:0 14px 14px;font-size:13px;line-height:1.75;color:#555;overflow-y:auto;-webkit-overflow-scrolling:touch;white-space:pre-line;flex:1;"></div>
        </div>
        <div id="v3d-nav" style="
          position:absolute;bottom:0;left:0;right:0;height:${NAV_H}px;
          background:rgba(255,255,255,0.96);border-top:1px solid #e8e8e8;
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          padding:0 16px;display:flex;align-items:center;gap:0;pointer-events:all;">
        </div>
      `;
    } else {
      // Mobile: sheet truot len tren nav
      return `
        <div id="v3d-sheet" style="
          position:absolute;bottom:${NAV_H}px;left:0;right:0;
          background:rgba(255,255,255,0.97);
          border-top:1px solid #e0e0e0;border-radius:16px 16px 0 0;
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          transform:translateY(100%);
          transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);
          max-height:42%;overflow:hidden;
          display:flex;flex-direction:column;
          pointer-events:all;
          box-shadow:0 -2px 20px rgba(0,0,0,0.08);">
          <div style="width:32px;height:4px;background:#d8d8d8;border-radius:2px;margin:8px auto 0;flex-shrink:0;"></div>
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px 4px;flex-shrink:0;">
            <div id="v3d-badge" style="padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:1px;flex-shrink:0;"></div>
            <div id="v3d-title" style="font-size:15px;font-weight:600;line-height:1.3;flex:1;color:#1a1a1a;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
            <button id="v3d-close" style="background:#f0f0f0;border:none;color:#888;font-size:14px;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;pointer-events:all;">✕</button>
          </div>
          <div id="v3d-sub" style="padding:0 14px 4px;font-size:11px;color:#aaa;flex-shrink:0;"></div>
          <div id="v3d-desc" style="padding:0 14px 14px;font-size:13px;line-height:1.75;color:#555;overflow-y:auto;-webkit-overflow-scrolling:touch;white-space:pre-line;"></div>
        </div>
        <div id="v3d-nav" style="
          position:absolute;bottom:0;left:0;right:0;height:${NAV_H}px;
          background:rgba(255,255,255,0.96);border-top:1px solid #e8e8e8;
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          padding:0 12px;display:flex;align-items:center;gap:0;pointer-events:all;">
        </div>
      `;
    }
  }

  function focusStation(id) {
    const { desktop } = getViewport();
    const st = STATIONS[id - 1];
    stationGroups.forEach((g, i) => { g.visible = i === id - 1; });

    if (!uiRoot) return;
    const badge = uiRoot.querySelector('#v3d-badge');
    badge.textContent = `GIAI ĐOẠN ${id}`;
    badge.style.cssText = `background:${st.hex}22;color:${st.hex};padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:1px;flex-shrink:0;`;
    uiRoot.querySelector('#v3d-title').textContent = st.name;
    uiRoot.querySelector('#v3d-sub').textContent = st.subtitle;
    uiRoot.querySelector('#v3d-desc').textContent = st.desc;

    const sheet = uiRoot.querySelector('#v3d-sheet');
    // Mobile: truot len; Desktop: truot vao tu phai
    sheet.style.transform = desktop ? 'translateX(0)' : 'translateY(0)';

    // Sheet da co noi dung moi -> tinh lai khung nhin de model khong bi che
    sheetOpen = true;
    const view = fitView(id);
    animateCamera(view.pos, view.target);
    applyView(true);

    STATIONS.forEach((_, i) => {
      const node = uiRoot.querySelector(`#v3d-node-${i}`);
      if (!node) return;
      node.style.borderColor = i === id - 1 ? STATIONS[i].hex : '#ddd';
      node.style.boxShadow = i === id - 1 ? `0 0 0 3px ${STATIONS[i].hex}33` : '';
    });
    for (let i = 1; i <= 4; i++) {
      const c = uiRoot.querySelector(`#v3d-conn-${i}`);
      if (c) c.style.width = i < id ? '100%' : '0%';
    }
  }

  function closePanel() {
    if (!uiRoot) return;
    const { desktop } = getViewport();
    const sheet = uiRoot.querySelector('#v3d-sheet');
    if (sheet) sheet.style.transform = desktop
      ? `translateX(${PANEL_W + 20}px)`
      : 'translateY(100%)';
    sheetOpen = false;
    const view = fitView();
    animateCamera(view.pos, view.target);
    applyView(true);
  }

  function animateCamera(toPos, toTarget) {
    const fp = camera.position.clone(), ft = controls.target.clone(), dur = 800, start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / dur, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      camera.position.lerpVectors(fp, toPos, e); controls.target.lerpVectors(ft, toTarget, e);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Animation loop
  function animate() {
    animationId = requestAnimationFrame(animate);
    if (controls) controls.update();

    const clock_t = performance.now() / 1000;
    const s2 = stationGroups[1]?.userData?.pottery;
    if (s2?.userData?.spinning) s2.rotation.y += 0.025;
    if (s2?.userData?.spinPart) s2.userData.spinPart.rotation.y += Math.PI / 30; // 60 vong/phut tai 60fps
    // Co ve hoa van o station 3: lay qua lai nhe nhu dang to mau
    const s3 = stationGroups[2]?.userData?.pottery;
    if (s3?.userData?.paintingBrush) {
      s3.userData.paintingBrush.rotation.z = -Math.PI / 3.3 + Math.sin(clock_t * 1.8) * 0.08;
      s3.userData.paintingBrush.position.x = 0.78 + Math.sin(clock_t * 1.8) * 0.04;
      s3.userData.paintingBrush.position.y = 2.37 + Math.sin(clock_t * 1.8) * 0.025;
    }
    const s5 = stationGroups[4]?.userData?.pottery;
    if (s5?.userData?.rotate) s5.rotation.y += 0.006;
    const s4 = stationGroups[3]?.userData?.pottery;
    if (s4) {
      if (s4.userData.fireLight) s4.userData.fireLight.intensity = 2 + Math.sin(clock_t * 9) * 0.8 + Math.sin(clock_t * 14) * 0.4;
      if (s4.userData.fireMesh) s4.userData.fireMesh.material.opacity = 0.6 + Math.sin(clock_t * 7) * 0.2;
      if (s4.userData.smoke) {
        const sp = s4.userData.smoke.geometry.attributes.position.array;
        for (let i = 0; i < sp.length; i += 3) {
          sp[i + 1] += 0.01; sp[i] += (Math.random() - 0.5) * 0.005;
          if (sp[i + 1] > 6) { sp[i + 1] = 3; sp[i] = -0.8 + (Math.random() - 0.5) * 0.3; }
        }
        s4.userData.smoke.geometry.attributes.position.needsUpdate = true;
      }
    }
    stationGroups.forEach((g, i) => { if (g.userData.edges) g.userData.edges.material.opacity = 0.35 + Math.sin(clock_t * 2 + i * 1.2) * 0.15; });

    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function onResize() {
    if (!containerEl || !camera || !renderer) return;
    isMobile = window.innerWidth < 768;
    const { cw, ch } = getViewport();

    // Cap nhat kich thuoc canvas div va renderer
    containerEl.style.width = cw + 'px';
    containerEl.style.height = ch + 'px';
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch);

    // Dat lai khung nhin theo layout moi
    const view = fitView();
    camera.position.copy(view.pos);
    controls.target.copy(view.target);
    applyView(false);
    controls.update();
  }

  function resetCamera() {
    if (!camera || !controls) return;
    const view = fitView();
    animateCamera(view.pos, view.target);
  }

  // Giai phong bo nho
  function dispose() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;

    if (uiRoot && uiRoot.parentElement) uiRoot.parentElement.removeChild(uiRoot);
    uiRoot = null;

    if (renderer) {
      renderer.dispose();
      if (renderer.domElement?.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    }
    if (controls) controls.dispose();
    window.removeEventListener('resize', onResize);

    if (scene) {
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => m.dispose());
        }
      });
    }

    scene = camera = renderer = controls = containerEl = null;
    stationGroups = [];
    TEX = null;
    initialized = false;
  }

  return { init, resetCamera, dispose };
})();

window.Viewer3D = Viewer3D;

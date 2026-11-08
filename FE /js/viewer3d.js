// viewer3d.js - Hien thi mo hinh gom 3D (Three.js)

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const Viewer3D = (() => {
  let scene, camera, renderer, controls;
  let animationId = null;
  let containerEl = null;
  let initialized = false;

  function init(containerId, modelUrl, firingTemp) {
    if (initialized) return;
    containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight || 400;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8e4e0);

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerEl.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 1, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

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

  // Anh sang
  function setupLights() {
    scene.add(new THREE.AmbientLight(0xffeedd, 0.4));

    const keyLight = new THREE.DirectionalLight(0xffd4a0, 1.2);
    keyLight.position.set(3, 5, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa0c4ff, 0.4);
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xff8844, 0.6, 15);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);
  }

  function addFloor() {
    const geo = new THREE.CircleGeometry(3, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xd8d0c8, roughness: 0.9 });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);
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

  // Tao binh gom bang code (khi chua co file .glb)
  function createProceduralPottery(firingTemp) {
    const group = new THREE.Group();

    // Profile binh gom dang cu toi
    const points = [
      new THREE.Vector2(0.0, 0.0), new THREE.Vector2(0.5, 0.0), new THREE.Vector2(0.6, 0.05),
      new THREE.Vector2(0.75, 0.3), new THREE.Vector2(0.95, 0.8),
      new THREE.Vector2(1.1, 1.2), new THREE.Vector2(1.15, 1.5), new THREE.Vector2(1.1, 1.8),
      new THREE.Vector2(0.9, 2.1), new THREE.Vector2(0.6, 2.3),
      new THREE.Vector2(0.35, 2.5), new THREE.Vector2(0.3, 2.7),
      new THREE.Vector2(0.35, 2.85), new THREE.Vector2(0.4, 2.9), new THREE.Vector2(0.38, 2.95),
    ];

    const bodyGeo = new THREE.LatheGeometry(points, 64);

    // Mau men thay doi theo nhiet do nung
    const tempRatio = Math.min(firingTemp / 1400, 1);
    const baseColor = new THREE.Color().lerpColors(
      new THREE.Color(0xb89070),
      new THREE.Color(0xd4c4b0),
      tempRatio
    );

    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
      color: baseColor, roughness: 0.55, metalness: 0.05,
    }));
    group.add(body);

    // Hoa tiet hoa sen dap noi
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xdda88a, roughness: 0.7 })
      );
      petal.position.set(Math.cos(angle) * 1.18, 1.5, Math.sin(angle) * 1.18);
      petal.scale.set(1, 1.5, 0.5);
      petal.lookAt(0, 1.5, 0);
      group.add(petal);
    }

    group.position.y = 0;
    scene.add(group);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function onResize() {
    if (!containerEl || !camera || !renderer) return;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight || 400;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function resetCamera() {
    if (!camera || !controls) return;
    camera.position.set(0, 2, 5);
    controls.target.set(0, 1, 0);
    controls.update();
  }

  // Giai phong bo nho
  function dispose() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;

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
    initialized = false;
  }

  return { init, resetCamera, dispose };
})();

window.Viewer3D = Viewer3D;

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const canvas = document.getElementById('equationCanvas');
if (canvas) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const equationGroup = new THREE.Group();
  scene.add(equationGroup);

  const formulas = [
    { text: 'eⁱπ + 1 = 0', x: -3.65, y: 2.55, z: -1.4, size: 0.62, color: '#f4d58d' },
    { text: 'E = mc²', x: 3.25, y: 2.05, z: 0.2, size: 0.78, color: '#88efff' },
    { text: 'a² + b² = c²', x: 3.35, y: 0.45, z: 0.5, size: 0.62, color: '#a3f5ce' },
    { text: '∫₀∞ e⁻ˣ dx = 1', x: -3.5, y: -0.55, z: -1.4, size: 0.56, color: '#ffa9ba' },
    { text: 'F = Gm₁m₂ / r²', x: 3.15, y: -1.15, z: -2, size: 0.54, color: '#a9c7ff' },
    { text: '∇ · E = ρ / ε₀', x: -3.45, y: -2.05, z: -2.5, size: 0.5, color: '#ffbf9a' },
    { text: 'Δx · Δp ≥ ℏ / 2', x: 2.65, y: -2.15, z: -3.4, size: 0.5, color: '#ddc2ff' },
    { text: '∂²u / ∂t² = c²∇²u', x: 0.15, y: 2.85, z: -3.6, size: 0.48, color: '#84e9e3' }
  ];

  const equationSprites = [];
  const textureCanvases = [];

  function createEquationSprite(formula) {
    const textureCanvas = document.createElement('canvas');
    const measureContext = textureCanvas.getContext('2d');
    const fontSize = 112;
    measureContext.font = `600 ${fontSize}px Georgia, 'Times New Roman', serif`;
    textureCanvas.width = Math.ceil(measureContext.measureText(formula.text).width + 96);
    textureCanvas.height = 190;

    const context = textureCanvas.getContext('2d');
    context.font = `600 ${fontSize}px Georgia, 'Times New Roman', serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = formula.color;
    context.shadowBlur = 22;
    context.fillStyle = formula.color;
    context.fillText(formula.text, textureCanvas.width / 2, textureCanvas.height / 2);
    context.shadowBlur = 0;
    context.strokeStyle = formula.color;
    context.globalAlpha = 0.32;
    context.lineWidth = 1.5;
    context.strokeText(formula.text, textureCanvas.width / 2, textureCanvas.height / 2);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      sizeAttenuation: true
    });
    const sprite = new THREE.Sprite(material);
    const worldHeight = formula.size;
    sprite.scale.set(worldHeight * textureCanvas.width / textureCanvas.height, worldHeight, 1);
    sprite.position.set(formula.x, formula.y, formula.z);
    sprite.userData.floatOffset = Math.random() * Math.PI * 2;
    sprite.userData.baseX = formula.x;
    sprite.userData.baseY = formula.y;
    sprite.userData.baseRotation = (Math.random() - 0.5) * 0.08;
    sprite.userData.desktopX = formula.x;
    sprite.userData.desktopY = formula.y;
    sprite.userData.mobileX = 2.7;
    sprite.userData.mobileY = formula.text === 'E = mc²' ? 1.15 : -1.95;
    sprite.userData.baseWidth = sprite.scale.x;
    sprite.userData.baseHeight = sprite.scale.y;
    equationGroup.add(sprite);
    equationSprites.push(sprite);
    textureCanvases.push({ texture, canvas: textureCanvas, material });
  }

  formulas.forEach(createEquationSprite);

  const starPositions = new Float32Array(2200 * 3);
  for (let star = 0; star < 2200; star += 1) {
    starPositions[star * 3] = (Math.random() - 0.5) * 48;
    starPositions[star * 3 + 1] = (Math.random() - 0.5) * 32;
    starPositions[star * 3 + 2] = Math.random() * 42 - 26;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starField = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xc5e5ff, size: 0.032, transparent: true, opacity: 0.82, sizeAttenuation: true })
  );
  scene.add(starField);

  const orbitingStars = [];
  const orbitStarMaterial = new THREE.MeshBasicMaterial({ color: 0xb8fff2 });
  const orbitStarGeometry = new THREE.SphereGeometry(0.028, 8, 6);
  for (let star = 0; star < 22; star += 1) {
    const mesh = new THREE.Mesh(orbitStarGeometry, orbitStarMaterial);
    scene.add(mesh);
    orbitingStars.push({ mesh, angle: (star / 22) * Math.PI * 2, radius: 2.3 + (star % 5) * 0.55 });
  }

  const baseScale = new THREE.Vector3(1, 1, 1);
  const projectedPosition = new THREE.Vector3();
  let targetRotationX = -0.08;
  let targetRotationY = -0.25;
  let equationHovered = false;
  let hoveredEquation = null;
  let clickSpin = 0;
  let targetClickSpin = 0;
  let clickPulse = 0;
  let previousTime = 0;

  function resizeScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    camera.aspect = aspect;
    camera.position.z = aspect < 0.75 ? 11.5 : 10;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    const responsiveScale = Math.min(1.35, Math.max(0.78, aspect * 0.76));
    baseScale.set(responsiveScale, responsiveScale, 1);
    equationGroup.scale.copy(baseScale);
    equationGroup.position.x = aspect > 1.25 ? 0.35 : 0;
    const compactLayout = width < 860;
    equationSprites.forEach((sprite, index) => {
      const showOnCompact = index === 1 || index === 6;
      sprite.visible = !compactLayout || showOnCompact;
      sprite.userData.baseX = compactLayout ? sprite.userData.mobileX : sprite.userData.desktopX;
      sprite.userData.baseY = compactLayout ? sprite.userData.mobileY : sprite.userData.desktopY;
      const size = compactLayout ? 0.72 : 1;
      sprite.userData.layoutSize = size;
      sprite.scale.set(sprite.userData.baseWidth * size, sprite.userData.baseHeight * size, 1);
    });
  }

  function findEquationAtPointer(clientX, clientY) {
    scene.updateMatrixWorld(true);
    for (const sprite of equationSprites) {
      if (!sprite.visible) continue;
      sprite.getWorldPosition(projectedPosition).project(camera);
      if (projectedPosition.z < -1 || projectedPosition.z > 1) continue;

      const centerX = (projectedPosition.x + 1) * window.innerWidth * 0.5;
      const centerY = (1 - projectedPosition.y) * window.innerHeight * 0.5;
      const depth = Math.max(0.1, camera.position.z - sprite.getWorldPosition(projectedPosition).z);
      const pixelsPerUnit = window.innerHeight / (2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
      const halfWidth = sprite.scale.x * pixelsPerUnit * 0.5 + 10;
      const halfHeight = sprite.scale.y * pixelsPerUnit * 0.5 + 10;

      if (Math.abs(clientX - centerX) <= halfWidth && Math.abs(clientY - centerY) <= halfHeight) {
        return sprite;
      }
    }
    return null;
  }

  function handlePointerMove(event) {
    if (event.pointerType === 'touch') return;
    const targetIsControl = event.target instanceof Element
      && event.target.closest('a, button, input, textarea, select, label');
    const horizontal = event.clientX / window.innerWidth - 0.5;
    const vertical = event.clientY / window.innerHeight - 0.5;

    const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
    const mobileEquationZone = window.innerWidth < 860
      && event.clientX > window.innerWidth * 0.62
      && event.clientY > headerBottom
      && event.clientY < window.innerHeight * 0.84;
    hoveredEquation = targetIsControl
      ? null
      : findEquationAtPointer(event.clientX, event.clientY)
        || (mobileEquationZone ? equationSprites.find((sprite) => sprite.visible) : null);
    equationHovered = Boolean(hoveredEquation);
    document.documentElement.classList.toggle('equation-hover', equationHovered);

    if (!equationHovered) {
      targetRotationY = -0.25 + horizontal * 0.65;
      targetRotationX = -0.08 + vertical * 0.42;
    }
  }

  function handleEquationClick(event) {
    if (reducedMotion || !equationHovered) return;
    const targetIsControl = event.target instanceof Element
      && event.target.closest('a, button, input, textarea, select, label');
    if (targetIsControl) return;
    targetClickSpin += Math.PI * 2;
    clickPulse = 1;
  }

  function renderFrame(time) {
    const elapsed = time * 0.001;
    const delta = Math.min((time - previousTime) * 0.001, 0.05);
    previousTime = time;

    equationGroup.rotation.x += (targetRotationX + Math.sin(elapsed * 0.55) * 0.035 - equationGroup.rotation.x) * 0.035;
    clickSpin += (targetClickSpin - clickSpin) * 0.035;
    equationGroup.rotation.y += (targetRotationY + elapsed * 0.035 + clickSpin - equationGroup.rotation.y) * 0.025;
    equationGroup.rotation.z = Math.sin(elapsed * 0.4) * 0.025;
    equationGroup.position.y = Math.sin(elapsed * 0.55) * 0.12;

    clickPulse *= 0.92;
    equationGroup.scale.copy(baseScale).multiplyScalar((equationHovered ? 1.035 : 1) * (1 + clickPulse * 0.08));

    equationSprites.forEach((sprite, index) => {
      const phase = elapsed * 0.6 + sprite.userData.floatOffset;
      sprite.position.x = sprite.userData.baseX + Math.sin(phase) * 0.12;
      sprite.position.y = sprite.userData.baseY + Math.sin(phase * 1.3) * 0.09;
      const layoutOpacity = window.innerWidth < 860 ? 0.92 : 1;
      sprite.material.opacity = (0.68 + (Math.sin(elapsed * 1.4 + index) + 1) * 0.1) * layoutOpacity;
      const hovered = equationHovered && hoveredEquation === sprite;
      const spriteScale = sprite.userData.layoutSize * (hovered ? 1.1 : 1);
      sprite.scale.set(sprite.userData.baseWidth * spriteScale, sprite.userData.baseHeight * spriteScale, 1);
      sprite.material.rotation = sprite.userData.baseRotation + Math.sin(phase) * 0.02;
    });

    starField.rotation.y += delta * 0.009;
    const positions = starGeometry.attributes.position.array;
    for (let star = 0; star < 2200; star += 1) {
      const depthIndex = star * 3 + 2;
      positions[depthIndex] += delta * 1.7;
      if (positions[depthIndex] > 16) positions[depthIndex] = -26;
    }
    starGeometry.attributes.position.needsUpdate = true;

    orbitingStars.forEach((star) => {
      const angle = star.angle + elapsed * 0.19;
      star.mesh.position.set(
        Math.cos(angle) * star.radius,
        Math.sin(angle * 1.3) * 2.5,
        Math.sin(angle) * 2.5
      );
    });

    renderer.render(scene, camera);
    if (!reducedMotion) requestAnimationFrame(renderFrame);
  }

  window.addEventListener('resize', resizeScene);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('click', handleEquationClick);
  resizeScene();
  requestAnimationFrame(renderFrame);
}

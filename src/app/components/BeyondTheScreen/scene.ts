
import * as THREE from "three";

export function createScene(container: HTMLDivElement) {
  // =====================================
  // SCENE, CAMERA AND RENDERER
  // =====================================

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#050706");
  scene.fog = new THREE.Fog("#050706", 18, 65);

  const camera = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.1,
    150
  );

  camera.position.set(0, 2.1, 10);
  camera.lookAt(0, 1.5, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;

  // =====================================
  // MATERIALS
  // =====================================

  const wallMat = new THREE.MeshStandardMaterial({
    color: "#101310",
    roughness: 0.95,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: "#080a09",
    roughness: 0.9,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: "#0b0e0c",
    roughness: 0.55,
    metalness: 0.15,
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: "#191a17",
    roughness: 0.82,
    metalness: 0.12,
  });

  const doorPanelMat = new THREE.MeshStandardMaterial({
    color: "#10120f",
    roughness: 0.9,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: "#343b36",
    metalness: 0.55,
    roughness: 0.42,
  });

  const silhouetteMat = new THREE.MeshStandardMaterial({
    color: "#050706",
    roughness: 1,
  });

  const mutedGreen = "#527d61";
  const softGreen = "#78a88a";

  // =====================================
  // HELPERS
  // =====================================

  function addBox(
    parent: THREE.Group,
    size: [number, number, number],
    position: [number, number, number],
    material: THREE.Material
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      material
    );

    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
  }

  function addLine(
    parent: THREE.Group,
    points: THREE.Vector3[],
    color: string,
    opacity = 0.35
  ) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    });

    const line = new THREE.Line(geometry, material);
    parent.add(line);

    return line;
  }

  // =====================================
  // MAIN ROOM
  // =====================================

  const room = new THREE.Group();
  scene.add(room);

  addBox(room, [18, 0.2, 30], [0, -0.12, -8], floorMat);
  addBox(room, [18, 7, 0.2], [0, 3.4, -22], wallMat);
  addBox(room, [0.2, 7, 30], [-9, 3.4, -8], wallMat);
  addBox(room, [0.2, 7, 30], [9, 3.4, -8], wallMat);
  addBox(room, [18, 0.2, 30], [0, 7, -8], darkMat);

  // Subtle floor lighting strips
  const floorStripMat = new THREE.MeshBasicMaterial({
    color: "#31533c",
    toneMapped: false,
  });

  addBox(room, [7, 0.025, 0.035], [0, 0.015, -1], floorStripMat);
  addBox(room, [7, 0.025, 0.035], [0, 0.015, -13], floorStripMat);

  // =====================================
  // DOOR AND FRAME
  // =====================================

  const doorFrame = new THREE.Group();
  doorFrame.position.set(0, 0, 1);
  room.add(doorFrame);

  addBox(doorFrame, [0.18, 4.4, 0.3], [-1.65, 2.2, 0], metalMat);
  addBox(doorFrame, [0.18, 4.4, 0.3], [1.65, 2.2, 0], metalMat);
  addBox(doorFrame, [3.5, 0.18, 0.3], [0, 4.4, 0], metalMat);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1.52, 0, 1.05);
  room.add(doorPivot);

  addBox(
    doorPivot,
    [3.05, 4.15, 0.14],
    [1.525, 2.075, 0],
    doorMat
  );

  // Recessed door panels
  addBox(
    doorPivot,
    [2.55, 1.55, 0.035],
    [1.525, 3.05, 0.09],
    doorPanelMat
  );

  addBox(
    doorPivot,
    [2.55, 1.25, 0.035],
    [1.525, 1.25, 0.09],
    doorPanelMat
  );

  // Door handle
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 16, 16),
    metalMat
  );

  handle.position.set(2.7, 2.05, 0.14);
  doorPivot.add(handle);

  // Hinges
  [0.6, 2.1, 3.6].forEach((y) => {
    addBox(
      doorPivot,
      [0.1, 0.25, 0.22],
      [0.05, y, 0],
      metalMat
    );
  });

  // Muted green edge light
  const doorEdgeMat = new THREE.MeshBasicMaterial({
    color: "#42694e",
    toneMapped: false,
  });

  addBox(doorFrame, [0.035, 3.9, 0.025], [-1.49, 2.1, 0.18], doorEdgeMat);

  // =====================================
  // DESK
  // =====================================

  const desk = new THREE.Group();
  desk.position.set(0, 0, -6.2);
  room.add(desk);

  addBox(desk, [4.5, 0.16, 1.8], [0, 1.55, 0], darkMat);

  [-1.9, 1.9].forEach((x) => {
    addBox(desk, [0.12, 1.5, 0.12], [x, 0.78, 0], metalMat);
  });

  // =====================================
  // LAPTOP
  // =====================================

  const laptop = new THREE.Group();
  laptop.position.set(0, 1.65, -0.3);
  desk.add(laptop);

  // Keyboard base
  addBox(laptop, [1.9, 0.08, 1.25], [0, 0, 0], metalMat);

  // Keyboard surface
  addBox(
    laptop,
    [1.65, 0.012, 0.72],
    [0, 0.048, 0.2],
    darkMat
  );

  // Keyboard keys
  const keyMat = new THREE.MeshBasicMaterial({
    color: "#31543d",
    toneMapped: false,
  });

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 13; col++) {
      addBox(
        laptop,
        [0.085, 0.012, 0.09],
        [-0.75 + col * 0.125, 0.058, -0.05 + row * 0.16],
        keyMat
      );
    }
  }

  // Laptop screen frame
  addBox(
    laptop,
    [1.9, 1.25, 0.07],
    [0, 0.64, -0.57],
    darkMat
  );

  // =====================================
  // LAPTOP TERMINAL DISPLAY
  // =====================================

  const codeCanvas = document.createElement("canvas");
  codeCanvas.width = 1024;
  codeCanvas.height = 640;

  const ctx = codeCanvas.getContext("2d");

  let terminalFrame = 0;

  const terminalMessages = [
    "> INITIALIZING SECURE SESSION",
    "[OK] NETWORK MODULE LOADED",
    "[OK] ENCRYPTION LAYER ACTIVE",
    "const system = await connect();",
    "function authenticate(user) {",
    "  return verifyIdentity(user);",
    "}",
    "[INFO] SCANNING ENVIRONMENT...",
    "[OK] DATABASE CONNECTION",
    "[OK] ACCESS TOKEN VERIFIED",
    "const status = 'ONLINE';",
    "loadSystemModules();",
    "executeProcess();",
    "[OK] SYSTEM ACCESS GRANTED",
  ];

  function drawTerminal() {
    if (!ctx) return;

    ctx.fillStyle = "#050907";
    ctx.fillRect(0, 0, 1024, 640);

    // Header
    ctx.fillStyle = "#0c1710";
    ctx.fillRect(0, 0, 1024, 58);

    ctx.fillStyle = "#78a88a";
    ctx.font = "bold 24px monospace";
    ctx.fillText("SYSTEM BREACH PROTOCOL  //  v3.9", 30, 37);

    ctx.fillStyle = "#547d62";
    ctx.font = "18px monospace";
    ctx.fillText("USER: NAVSETU_", 780, 37);

    // Main terminal frame
    ctx.strokeStyle = "#31513b";
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 78, 974, 520);

    // Terminal section
    ctx.fillStyle = "#91b49a";
    ctx.font = "bold 22px monospace";
    ctx.fillText("SECURE TERMINAL", 50, 118);

    ctx.fillStyle = "#527d61";
    ctx.font = "18px monospace";
    ctx.fillText("LIVE SYSTEM LOG", 50, 151);

    // Scrolling terminal lines
    const offset = Math.floor(terminalFrame / 8);

    ctx.font = "20px monospace";

    for (let i = 0; i < 12; i++) {
      const message =
        terminalMessages[(i + offset) % terminalMessages.length];

      ctx.fillStyle = i % 3 === 0 ? "#91b49a" : "#5e9870";
      ctx.fillText(message, 52, 205 + i * 29);
    }

    // Right-side data panel
    ctx.strokeStyle = "#31513b";
    ctx.strokeRect(720, 170, 245, 160);

    ctx.fillStyle = "#78a88a";
    ctx.font = "bold 17px monospace";
    ctx.fillText("NETWORK STATUS", 740, 199);

    ctx.fillStyle = "#527d61";
    ctx.font = "16px monospace";
    ctx.fillText("PING: 024ms", 740, 235);
    ctx.fillText("ENCRYPTION: AES", 740, 263);
    ctx.fillText("CONNECTION: SAFE", 740, 291);

    // Small waveform
    ctx.beginPath();
    ctx.strokeStyle = "#659b75";
    ctx.lineWidth = 2;

    for (let i = 0; i < 190; i++) {
      const x = 745 + i;
      const y =
        405 +
        Math.sin((i + terminalFrame * 2) * 0.12) * 12 +
        Math.sin(i * 0.31) * 5;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Bottom status bar
    ctx.fillStyle = "#14241a";
    ctx.fillRect(50, 550, 910, 18);

    ctx.fillStyle = "#5e9870";
    ctx.fillRect(50, 550, 910 * ((terminalFrame % 180) / 180), 18);

    // Blinking cursor
    if (Math.floor(terminalFrame / 25) % 2 === 0) {
      ctx.fillStyle = "#a0c4a8";
      ctx.fillRect(52, 590, 13, 22);
    }

    terminalFrame++;
    codeTexture.needsUpdate = true;
  }

  const codeTexture = new THREE.CanvasTexture(codeCanvas);
  codeTexture.colorSpace = THREE.SRGBColorSpace;

  const codeScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.76, 1.1),
    new THREE.MeshBasicMaterial({
      map: codeTexture,
      toneMapped: false,
    })
  );

  codeScreen.position.set(0, 0.65, -0.505);
  laptop.add(codeScreen);

  drawTerminal();

  // =====================================
  // DEVELOPER SILHOUETTE
  // =====================================

  const developer = new THREE.Group();
  developer.position.set(0, 0, -7.7);
  room.add(developer);

  addBox(developer, [1.3, 0.16, 1.2], [0, 1.05, 0.5], darkMat);
  addBox(developer, [1.3, 1.8, 0.16], [0, 1.95, 1.05], darkMat);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.48, 0.95, 5, 12),
    silhouetteMat
  );

  body.position.set(0, 2.05, 0.25);
  body.rotation.x = -0.18;
  developer.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 20, 20),
    silhouetteMat
  );

  head.position.set(0, 3.05, -0.18);
  developer.add(head);

  const armGeometry = new THREE.CapsuleGeometry(0.12, 0.8, 4, 8);

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(armGeometry, silhouetteMat);
    arm.position.set(side * 0.52, 2.15, -0.25);
    arm.rotation.z = side * -0.6;
    developer.add(arm);
  });

  // =====================================
  // DIGITAL WORLD - HIDDEN BEHIND SCREEN
  // =====================================

  const digitalWorld = new THREE.Group();
  digitalWorld.visible = false;
  scene.add(digitalWorld);

  // Tunnel floor
  const digitalFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 55),
    new THREE.MeshBasicMaterial({
      color: "#050a07",
      side: THREE.DoubleSide,
    })
  );

  digitalFloor.rotation.x = -Math.PI / 2;
  digitalFloor.position.set(0, -1, -34);
  digitalWorld.add(digitalFloor);

  // Tunnel grid
  const gridMaterial = new THREE.LineBasicMaterial({
    color: "#28563a",
    transparent: true,
    opacity: 0.32,
  });

  const brightGridMaterial = new THREE.LineBasicMaterial({
    color: "#527d61",
    transparent: true,
    opacity: 0.5,
  });

  for (let i = 0; i <= 30; i++) {
    const z = -9 - i * 1.5;

    addLine(
      digitalWorld,
      [
        new THREE.Vector3(-9, -0.95, z),
        new THREE.Vector3(9, -0.95, z),
      ],
      i % 4 === 0 ? "#527d61" : "#28563a",
      i % 4 === 0 ? 0.45 : 0.22
    );
  }

  for (let i = 0; i <= 24; i++) {
    const x = -9 + i * 0.75;

    addLine(
      digitalWorld,
      [
        new THREE.Vector3(x, -0.95, -9),
        new THREE.Vector3(x, -0.95, -55),
      ],
      i % 4 === 0 ? "#527d61" : "#28563a",
      i % 4 === 0 ? 0.4 : 0.18
    );
  }

  // Floating code panels - kept inside the tunnel
  const terminalPanels: THREE.Mesh[] = [];

  const panelTexts = [
    "NETWORK / SECURE",
    "AUTHENTICATION OK",
    "DATA STREAM ACTIVE",
    "SYSTEM ACCESS GRANTED",
    "ENCRYPTION ENABLED",
    "PROCESS RUNNING",
  ];

  panelTexts.forEach((message, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 240;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "rgba(5, 12, 8, 0.96)";
    context.fillRect(0, 0, 640, 240);

    context.strokeStyle = "#355d40";
    context.lineWidth = 3;
    context.strokeRect(3, 3, 634, 234);

    context.fillStyle = "#91b49a";
    context.font = "bold 27px monospace";
    context.fillText("SYSTEM / TERMINAL", 25, 52);

    context.fillStyle = "#659b75";
    context.font = "23px monospace";
    context.fillText("> " + message, 25, 110);

    context.fillStyle = "#527d61";
    context.font = "19px monospace";
    context.fillText("STATUS: ACTIVE  //  0" + (index + 1), 25, 165);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.98),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        toneMapped: false,
      })
    );

    const side = index % 2 === 0 ? -1 : 1;

    panel.position.set(
      side * 3.4,
      1.5 + (index % 3) * 0.7,
      -15 - index * 5
    );

    panel.rotation.y = side * -0.18;

    digitalWorld.add(panel);
    terminalPanels.push(panel);
  });

  // Data nodes
  const dataNodes: THREE.Mesh[] = [];

  const nodeGeometry = new THREE.SphereGeometry(0.025, 8, 8);
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: "#6c9b78",
    toneMapped: false,
  });

  for (let i = 0; i < 85; i++) {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);

    node.position.set(
      (Math.random() - 0.5) * 12,
      Math.random() * 5,
      -12 - Math.random() * 42
    );

    digitalWorld.add(node);
    dataNodes.push(node);
  }

  // Distant focal point
  const portalCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 2),
    new THREE.MeshBasicMaterial({
      color: "#315d40",
      wireframe: true,
      toneMapped: false,
    })
  );

  portalCore.position.set(0, 2.2, -52);
  digitalWorld.add(portalCore);

  // =====================================
  // LIGHTING
  // =====================================

  scene.add(new THREE.AmbientLight("#84918a", 0.22));

  const roomLight = new THREE.PointLight("#557b65", 9, 13);
  roomLight.position.set(0, 4.5, -7);
  room.add(roomLight);

  const screenLight = new THREE.PointLight("#4b9b69", 5, 6);
  screenLight.position.set(0, 2.8, -5.5);
  room.add(screenLight);

  const hallwayLight = new THREE.PointLight("#87968d", 12, 15);
  hallwayLight.position.set(-1, 4.5, 4);
  room.add(hallwayLight);

  const doorLight = new THREE.PointLight("#54785e", 8, 9);
  doorLight.position.set(0, 2.5, 2.5);
  room.add(doorLight);

  const digitalLight = new THREE.PointLight("#41694d", 12, 35);
  digitalLight.position.set(0, 3, -25);
  digitalWorld.add(digitalLight);

  // =====================================
  // RESIZE
  // =====================================

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }

  // =====================================
  // ANIMATION AND CLEANUP
  // =====================================

  function update() {
    drawTerminal();

    portalCore.rotation.x += 0.001;
    portalCore.rotation.y += 0.002;

    renderer.render(scene, camera);
  }

  function dispose() {
    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Line
      ) {
        object.geometry.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) {
              value.dispose();
            }
          });

          material.dispose();
        });
      }
    });

    renderer.dispose();
    renderer.domElement.remove();
  }

  renderer.render(scene, camera);

  return {
    scene,
    camera,
    renderer,
    room,
    doorPivot,
    laptop,
    developer,
    digitalWorld,
    terminalPanels,
    dataNodes,
    resize,
    update,
    dispose,
  };
}


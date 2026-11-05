import * as THREE from "three";
import { makeCanvas, mulberry32, smoothstep } from "./util";

/* All dimensions are in metres. +z points toward the viewer / hallway,
   the partition wall with the door sits at z = 0, the desk is at z ≈ -6.7. */

export const LAPTOP_SCALE = 1.25;
export const SCREEN_W = 0.392 * LAPTOP_SCALE;
export const SCREEN_H = 0.245 * LAPTOP_SCALE;
export const DOOR_OPEN_ANGLE = 1.9;

function woodTexture() {
  const rand = mulberry32(7);
  const { canvas, ctx } = makeCanvas(512, 1024);
  ctx.fillStyle = "#2a1d17";
  ctx.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 220; i++) {
    const x = rand() * 512;
    const w = 1 + rand() * 3;
    ctx.strokeStyle =
      rand() > 0.5
        ? `rgba(0,0,0,${0.1 + rand() * 0.2})`
        : `rgba(104,72,52,${0.06 + rand() * 0.12})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 1024; y += 64) {
      ctx.lineTo(x + Math.sin(y * 0.01 + i) * 6 * rand(), y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function noiseTexture(base: string, amount: number, repeatX: number, repeatY: number) {
  const rand = mulberry32(21);
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = rand() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${rand() * amount})`;
    ctx.fillRect(rand() * 256, rand() * 256, 1 + rand() * 2, 1 + rand() * 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  return tex;
}

function blindsTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#5f8f93");
  g.addColorStop(1, "#27403f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  for (let y = 0; y < 256; y += 16) ctx.fillRect(0, y + 9, 256, 7);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function networkMapTexture() {
  const rand = mulberry32(5);
  const { canvas, ctx } = makeCanvas(512, 320);
  ctx.fillStyle = "#050c09";
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = "#16382b";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 508, 316);
  const pts = Array.from({ length: 22 }, () => [24 + rand() * 464, 24 + rand() * 272]);
  ctx.strokeStyle = "rgba(61,158,152,0.45)";
  ctx.lineWidth = 1.2;
  pts.forEach((p, i) => {
    const q = pts[(i * 7 + 2) % pts.length];
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  });
  pts.forEach((p) => {
    ctx.fillStyle = "#4fae80";
    ctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function monitorTexture() {
  const rand = mulberry32(13);
  const { canvas, ctx } = makeCanvas(512, 220);
  ctx.fillStyle = "#040a08";
  ctx.fillRect(0, 0, 512, 220);
  ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
  for (let i = 0; i < 15; i++) {
    const indent = Math.floor(rand() * 4) * 16;
    const len = 60 + rand() * 260;
    ctx.fillStyle = ["#2d6e57", "#3d8a85", "#6b6b44", "#2d6e57"][i % 4];
    ctx.fillRect(18 + indent, 18 + i * 13, len, 5);
  }
  ctx.fillStyle = "#0b1d15";
  ctx.fillRect(360, 18, 134, 184);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = "#2f8f6c";
    ctx.fillRect(370, 30 + i * 19, 20 + rand() * 100, 8);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRoom(screenMaterial: THREE.Material) {
  const group = new THREE.Group();
  const rand = mulberry32(99);

  // ---------- Materials ----------
  const woodTex = woodTexture();
  const concrete = noiseTexture("#1b2020", 0.07, 3, 1.5);
  const floorNoise = noiseTexture("#101414", 0.1, 4, 6);

  const wallMat = new THREE.MeshStandardMaterial({ map: concrete, color: "#9aa5a2", roughness: 0.92 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorNoise, color: "#8f9996", roughness: 0.3, metalness: 0.12 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: "#0c0f0f", roughness: 1 });
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, bumpMap: woodTex, bumpScale: 0.6, color: "#7d736b", roughness: 0.5, metalness: 0.05 });
  const woodPanelMat = new THREE.MeshStandardMaterial({ map: woodTex, color: "#6f655d", roughness: 0.62 });
  const metalMat = new THREE.MeshStandardMaterial({ color: "#2e3436", metalness: 0.85, roughness: 0.34 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: "#141819", metalness: 0.7, roughness: 0.45 });
  const deskMat = new THREE.MeshStandardMaterial({ map: woodTex, color: "#6e6259", roughness: 0.45, metalness: 0.05 });
  const plastic = new THREE.MeshStandardMaterial({ color: "#0d1011", roughness: 0.55, metalness: 0.2 });
  const silhouette = new THREE.MeshStandardMaterial({ color: "#060808", roughness: 0.95, metalness: 0 });
  const rugMat = new THREE.MeshStandardMaterial({ color: "#0c1211", roughness: 1 });

  const box = (
    w: number, h: number, d: number, mat: THREE.Material,
    x: number, y: number, z: number, parent: THREE.Object3D = group,
    cast = true, receive = true
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  };

  const limb = (a: THREE.Vector3, b: THREE.Vector3, r: number, parent: THREE.Object3D) => {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 4, 10), silhouette);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // ---------- Shell ----------
  const ROOM_X = 3.2;
  const FRONT = 6;
  const BACK = -7.4;
  const HEIGHT = 3;
  const depth = FRONT - BACK;
  const midZ = (FRONT + BACK) / 2;

  box(ROOM_X * 2, 0.1, depth, floorMat, 0, -0.05, midZ, group, false, true);
  box(ROOM_X * 2, 0.1, depth, ceilMat, 0, HEIGHT + 0.05, midZ, group, false, true);
  box(0.1, HEIGHT, depth, wallMat, -ROOM_X - 0.05, HEIGHT / 2, midZ, group, false, true);
  box(0.1, HEIGHT, depth, wallMat, ROOM_X + 0.05, HEIGHT / 2, midZ, group, false, true);
  box(ROOM_X * 2, HEIGHT, 0.1, wallMat, 0, HEIGHT / 2, BACK - 0.05, group, false, true);

  // Partition wall with a door opening 1.0 x 2.2
  const OPEN_W = 1.0;
  const OPEN_H = 2.2;
  const sideW = ROOM_X - OPEN_W / 2;
  box(sideW, HEIGHT, 0.24, wallMat, -(OPEN_W / 2 + sideW / 2), HEIGHT / 2, 0);
  box(sideW, HEIGHT, 0.24, wallMat, OPEN_W / 2 + sideW / 2, HEIGHT / 2, 0);
  box(OPEN_W, HEIGHT - OPEN_H, 0.24, wallMat, 0, OPEN_H + (HEIGHT - OPEN_H) / 2, 0);

  // Skirting and light trim
  box(ROOM_X * 2, 0.09, 0.03, darkMetal, 0, 0.045, 0.135, group, false, true);
  box(0.03, 0.09, 6, darkMetal, -ROOM_X + 0.02, 0.045, 3, group, false, true);
  box(0.03, 0.09, 6, darkMetal, ROOM_X - 0.02, 0.045, 3, group, false, true);

  // ---------- Door frame ----------
  box(0.07, OPEN_H + 0.07, 0.26, metalMat, -OPEN_W / 2 - 0.035, (OPEN_H + 0.07) / 2, 0);
  box(0.07, OPEN_H + 0.07, 0.26, metalMat, OPEN_W / 2 + 0.035, (OPEN_H + 0.07) / 2, 0);
  box(OPEN_W + 0.14, 0.07, 0.26, metalMat, 0, OPEN_H + 0.035, 0);

  // ---------- Door leaf (hinged at the left jamb, swings inward) ----------
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-OPEN_W / 2 + 0.03, 0, 0);
  group.add(doorPivot);

  const leafW = OPEN_W - 0.06;
  const leafH = OPEN_H - 0.03;
  box(leafW, leafH, 0.05, woodMat, leafW / 2, 0.03 + leafH / 2, 0, doorPivot);

  for (const face of [1, -1]) {
    for (let col = 0; col < 2; col++) {
      for (let row = 0; row < 3; row++) {
        const pw = 0.33;
        const ph = row === 1 ? 0.62 : 0.52;
        const py = [0.5, 1.1, 1.78][row] - (row === 1 ? 0.0 : 0);
        box(pw, ph, 0.012, woodPanelMat, 0.25 + col * 0.42, py, face * 0.029, doorPivot);
      }
    }
  }
  box(leafW, 0.17, 0.056, metalMat, leafW / 2, 0.12, 0, doorPivot);

  // Lever handle (both sides)
  for (const face of [1, -1]) {
    box(0.05, 0.11, 0.012, metalMat, leafW - 0.07, 1.05, face * 0.034, doorPivot);
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.13, 10), metalMat);
    lever.rotation.z = Math.PI / 2;
    lever.position.set(leafW - 0.13, 1.05, face * 0.065);
    lever.castShadow = true;
    doorPivot.add(lever);
  }
  // Hinges
  [0.25, 1.1, 1.95].forEach((y) =>
    box(0.045, 0.14, 0.07, metalMat, -0.005, y, 0, doorPivot)
  );

  // ---------- Keypad beside the door ----------
  box(0.09, 0.15, 0.025, plastic, 0.76, 1.2, 0.132);
  const keypadLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.018, 0.004),
    new THREE.MeshBasicMaterial({ color: "#2f8a63", toneMapped: false })
  );
  keypadLed.position.set(0.76, 1.255, 0.146);
  group.add(keypadLed);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const k = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.012, 0.004),
        new THREE.MeshBasicMaterial({ color: "#1b3a2d", toneMapped: false })
      );
      k.position.set(0.735 + c * 0.025, 1.21 - r * 0.02, 0.146);
      group.add(k);
    }
  }

  // Light leaking under the closed door
  const leakCanvas = makeCanvas(8, 64);
  const lg = leakCanvas.ctx.createLinearGradient(0, 0, 0, 64);
  lg.addColorStop(0, "rgba(80,190,150,0.9)");
  lg.addColorStop(1, "rgba(80,190,150,0)");
  leakCanvas.ctx.fillStyle = lg;
  leakCanvas.ctx.fillRect(0, 0, 8, 64);
  const leakTex = new THREE.CanvasTexture(leakCanvas.canvas);
  leakTex.colorSpace = THREE.SRGBColorSpace;
  const leakMat = new THREE.MeshBasicMaterial({
    map: leakTex, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const leak = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.4), leakMat);
  leak.rotation.x = -Math.PI / 2;
  leak.position.set(0, 0.004, 0.34);
  group.add(leak);

  // ---------- Desk ----------
  const desk = new THREE.Group();
  desk.position.set(0.35, 0, -6.75);
  group.add(desk);
  box(2.5, 0.045, 0.82, deskMat, 0, 0.745, 0, desk);
  [[-1.15, -0.34], [1.15, -0.34], [-1.15, 0.34], [1.15, 0.34]].forEach(([x, z]) =>
    box(0.05, 0.72, 0.05, darkMetal, x, 0.36, z, desk)
  );
  box(2.3, 0.04, 0.04, darkMetal, 0, 0.28, -0.34, desk);

  // Rug
  box(3.2, 0.01, 2.4, rugMat, 0.3, 0.005, -5.5, group, false, true);

  // ---------- Laptop ----------
  const laptop = new THREE.Group();
  laptop.position.set(-0.4, 0.768, -6.62);
  laptop.scale.setScalar(LAPTOP_SCALE);
  group.add(laptop);

  box(0.42, 0.016, 0.29, darkMetal, 0, 0.008, 0, laptop);
  const glowStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(0.37, 0.12),
    new THREE.MeshBasicMaterial({ color: "#10301f", toneMapped: false })
  );
  glowStrip.rotation.x = -Math.PI / 2;
  glowStrip.position.set(0, 0.0165, -0.045);
  laptop.add(glowStrip);

  const keyGeo = new THREE.BoxGeometry(0.0225, 0.006, 0.0215);
  const keys = new THREE.InstancedMesh(keyGeo, plastic, 5 * 14);
  const m4 = new THREE.Matrix4();
  let ki = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 14; c++) {
      m4.setPosition((c - 6.5) * 0.0265, 0.019, -0.095 + r * 0.0245);
      keys.setMatrixAt(ki++, m4);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  laptop.add(keys);
  box(0.11, 0.002, 0.07, darkMetal, 0, 0.0165, 0.105, laptop, false, true);

  const lid = new THREE.Group();
  lid.position.set(0, 0.018, -0.14);
  lid.rotation.x = -0.2618; // 105 degree opening
  laptop.add(lid);
  box(0.42, 0.285, 0.012, plastic, 0, 0.1425, 0, lid);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.392, 0.245), screenMaterial);
  screen.position.set(0, 0.145, 0.0066);
  lid.add(screen);

  // ---------- Secondary monitor ----------
  const monitor = new THREE.Group();
  monitor.position.set(1.05, 0.768, -6.98);
  group.add(monitor);
  box(0.9, 0.38, 0.03, plastic, 0, 0.36, 0, monitor);
  box(0.06, 0.2, 0.04, darkMetal, 0, 0.1, -0.03, monitor);
  box(0.28, 0.012, 0.18, darkMetal, 0, 0.006, -0.02, monitor);
  const monitorScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.34),
    new THREE.MeshBasicMaterial({ map: monitorTexture(), color: "#7aa090", toneMapped: false })
  );
  monitorScreen.position.set(0, 0.36, 0.0156);
  monitor.add(monitorScreen);
  box(0.46, 0.012, 0.15, darkMetal, -0.1, 0.006, 0.28, monitor);
  box(0.12, 0.03, 0.2, plastic, 0.32, 0.015, 0.3, monitor);

  // Mug
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.034, 0.09, 20), darkMetal);
  mug.position.set(-0.78, 0.812, -6.55);
  mug.castShadow = true;
  group.add(mug);

  // Cables
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.4, 0.77, -6.82),
        new THREE.Vector3(-0.35, 0.74, -7.0),
        new THREE.Vector3(-0.2, 0.3, -7.15),
        new THREE.Vector3(-0.1, 0.02, -7.2),
      ]),
      24, 0.008, 6
    ),
    plastic
  );
  group.add(cable);

  // ---------- Developer + chair (seen from behind, facing the monitor) ----------
  const dev = new THREE.Group();
  dev.position.set(1.05, 0, -5.9);
  group.add(dev);

  box(0.46, 0.06, 0.44, silhouette, 0, 0.47, 0, dev);
  box(0.44, 0.58, 0.06, silhouette, 0, 0.84, 0.23, dev);
  box(0.3, 0.17, 0.05, silhouette, 0, 1.26, 0.23, dev);
  const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 10), darkMetal);
  lift.position.set(0, 0.25, 0);
  dev.add(lift);
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const arm = box(0.3, 0.025, 0.035, darkMetal, Math.cos(ang) * 0.15, 0.05, Math.sin(ang) * 0.15, dev);
    arm.rotation.y = -ang;
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), darkMetal);
    wheel.position.set(Math.cos(ang) * 0.29, 0.03, Math.sin(ang) * 0.29);
    dev.add(wheel);
  }

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.36, 6, 14), silhouette);
  torso.scale.set(1.25, 1, 0.85);
  torso.position.set(0, 0.96, 0.02);
  torso.rotation.x = -0.14;
  torso.castShadow = true;
  dev.add(torso);

  const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 4, 10), silhouette);
  shoulders.rotation.z = Math.PI / 2;
  shoulders.position.set(0, 1.18, -0.02);
  shoulders.castShadow = true;
  dev.add(shoulders);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.1, 10), silhouette);
  neck.position.set(0, 1.29, -0.04);
  dev.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), silhouette);
  head.scale.set(0.95, 1.12, 1.05);
  head.position.set(0, 1.43, -0.07);
  head.castShadow = true;
  dev.add(head);

  const band = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.011, 8, 28, Math.PI), darkMetal);
  band.rotation.set(0, Math.PI / 2, 0);
  band.position.set(0, 1.44, -0.07);
  dev.add(band);
  [-1, 1].forEach((s) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 16), darkMetal);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(s * 0.122, 1.43, -0.07);
    dev.add(cup);
  });

  [-1, 1].forEach((s) => {
    const shoulder = new THREE.Vector3(s * 0.21, 1.17, -0.02);
    const elbow = new THREE.Vector3(s * 0.26, 0.93, -0.2);
    const hand = new THREE.Vector3(s * 0.15, 0.82, -0.5);
    limb(shoulder, elbow, 0.055, dev);
    limb(elbow, hand, 0.045, dev);
    const knee = new THREE.Vector3(s * 0.13, 0.55, -0.42);
    limb(new THREE.Vector3(s * 0.12, 0.54, 0.05), knee, 0.075, dev);
    limb(knee, new THREE.Vector3(s * 0.13, 0.08, -0.46), 0.06, dev);
  });

  // ---------- Environmental details ----------
  // Server rack (left wall)
  const rack = new THREE.Group();
  rack.position.set(-2.75, 0, -5.4);
  group.add(rack);
  box(0.8, 1.9, 0.7, darkMetal, 0, 0.95, 0, rack);
  for (let i = 0; i < 9; i++) box(0.01, 0.12, 0.62, plastic, 0.405, 0.2 + i * 0.19, 0, rack);

  const LEDS = 54;
  const ledMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.006, 0.01, 0.01),
    new THREE.MeshBasicMaterial({ toneMapped: false }),
    LEDS
  );
  const ledColors = [new THREE.Color("#2f8a63"), new THREE.Color("#2a7c78"), new THREE.Color("#8a7a4a"), new THREE.Color("#0a1410")];
  for (let i = 0; i < LEDS; i++) {
    const row = Math.floor(i / 6);
    const col = i % 6;
    m4.setPosition(0.412, 0.2 + row * 0.19 + 0.02, -0.25 + col * 0.045);
    ledMesh.setMatrixAt(i, m4);
    ledMesh.setColorAt(i, ledColors[Math.floor(rand() * 3)]);
  }
  rack.add(ledMesh);

  // Shelf with boxes (right wall)
  const shelf = new THREE.Group();
  shelf.position.set(3.0, 0, -5.2);
  group.add(shelf);
  [0.9, 1.4, 1.9].forEach((y) => {
    box(0.3, 0.03, 1.6, darkMetal, 0, y, 0, shelf);
    let z = -0.7;
    while (z < 0.7) {
      const w = 0.05 + rand() * 0.08;
      const h = 0.14 + rand() * 0.18;
      const shade = Math.floor(10 + rand() * 18);
      const mat = new THREE.MeshStandardMaterial({ color: `rgb(${shade},${shade + 3},${shade + 2})`, roughness: 0.8 });
      box(0.2, h, w, mat, 0, y + 0.015 + h / 2, z + w / 2, shelf);
      z += w + 0.01;
    }
  });

  // Window with blinds
  const windowMat = new THREE.MeshBasicMaterial({
    map: blindsTexture(), transparent: true, opacity: 0.5, toneMapped: false,
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.1), windowMat);
  win.position.set(3.19, 1.7, -2.6);
  win.rotation.y = -Math.PI / 2;
  group.add(win);

  // Network map on the back wall
  const mapPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.94),
    new THREE.MeshBasicMaterial({ map: networkMapTexture(), color: "#6d8c80", transparent: true, opacity: 0.8, toneMapped: false })
  );
  mapPlane.position.set(-1.9, 1.55, -7.39);
  group.add(mapPlane);

  // Ceiling light strip over the desk
  box(1.6, 0.02, 0.06, new THREE.MeshBasicMaterial({ color: "#6f8f84", toneMapped: false }), 0.3, 2.98, -5.2, group, false, false);

  // ---------- Lights ----------
  group.add(new THREE.AmbientLight("#6f8a80", 0.1));

  const hallSpot = new THREE.SpotLight("#cfe3da", 85, 10, 0.7, 0.8, 2);
  hallSpot.position.set(0.5, 2.9, 2.3);
  hallSpot.target.position.set(0, 1.0, 0);
  hallSpot.castShadow = true;
  hallSpot.shadow.mapSize.set(1024, 1024);
  hallSpot.shadow.bias = -0.0006;
  group.add(hallSpot, hallSpot.target);

  const hallFill = new THREE.PointLight("#5f8a7a", 5, 8, 2);
  hallFill.position.set(-1.2, 2.2, 3.4);
  group.add(hallFill);

  const keySpot = new THREE.SpotLight("#a9c9bd", 0, 11, 0.95, 0.9, 2);
  keySpot.position.set(0.2, 2.95, -4.0);
  keySpot.target.position.set(0, 0.75, -6.4);
  keySpot.castShadow = true;
  keySpot.shadow.mapSize.set(1024, 1024);
  keySpot.shadow.bias = -0.0006;
  group.add(keySpot, keySpot.target);

  const roomFill = new THREE.PointLight("#6b8d82", 0, 9, 2);
  roomFill.position.set(0, 2.6, -2.2);
  group.add(roomFill);

  const windowSpot = new THREE.SpotLight("#4d7a85", 0, 8, 0.8, 0.9, 2);
  windowSpot.position.set(3.1, 1.8, -2.6);
  windowSpot.target.position.set(0.3, 0.6, -4.8);
  group.add(windowSpot, windowSpot.target);

  const screenLight = new THREE.PointLight("#3f9e7c", 1.6, 4.5, 2);
  screenLight.position.set(-0.4, 1.0, -6.2);
  group.add(screenLight);

  const monitorLight = new THREE.PointLight("#2f7f86", 1.1, 4, 2);
  monitorLight.position.set(1.05, 1.15, -6.6);
  group.add(monitorLight);

  const rimLight = new THREE.PointLight("#4d8a8a", 1.5, 5, 2);
  rimLight.position.set(1.05, 1.6, -4.7);
  group.add(rimLight);

  // ---------- Dynamic state ----------
  const keyBase = 32;
  const fillBase = 3.2;
  const windowBase = 18;
  let lastLed = 0;

  function setDoor(v: number) {
    doorPivot.rotation.y = v * DOOR_OPEN_ANGLE;
    const gain = smoothstep(0.02, 0.7, v);
    keySpot.intensity = keyBase * gain;
    roomFill.intensity = fillBase * gain;
    windowSpot.intensity = windowBase * gain;
    leakMat.opacity = 0.45 * (1 - smoothstep(0, 0.12, v));
  }

  function update(time: number) {
    screenLight.intensity = 1.6 + Math.sin(time * 7.3) * 0.06 + Math.sin(time * 2.1) * 0.08;
    keypadLed.visible = Math.sin(time * 2.4) > -0.55;
    torso.scale.y = 1 + Math.sin(time * 1.1) * 0.012;

    if (time - lastLed > 0.35) {
      lastLed = time;
      for (let i = 0; i < 6; i++) {
        ledMesh.setColorAt(Math.floor(Math.random() * LEDS), ledColors[Math.floor(Math.random() * 4)]);
      }
      if (ledMesh.instanceColor) ledMesh.instanceColor.needsUpdate = true;
    }
  }

  /** Shadow maps are the single most expensive part of the room on phones. */
  function setQuality(shadows: boolean) {
    hallSpot.castShadow = shadows;
    keySpot.castShadow = shadows;
  }

  // Receive shadows on everything static
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.receiveShadow = true;
    }
  });

  setDoor(0);

  return { group, screen, setDoor, update, setQuality };
}

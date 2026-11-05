import * as THREE from "three";
import { disposeObject, makeCanvas, mulberry32 } from "./util";

/** Total distance the camera travels inside the digital world. */
export const DEPTH_MAX = 335;

const TUNNEL_START = 12;
const TUNNEL_END = -352;
const GATE_Z = -362;

const PROFILE: [number, number][] = [
  [-4.4, -3], [4.4, -3], [6, -1.4], [6, 2.6],
  [4.4, 4.2], [-4.4, 4.2], [-6, 2.6], [-6, -1.4],
];

const GRID_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const GRID_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vWorld;
  float gridLine(vec2 p, float scale) {
    vec2 q = p / scale;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    float l1 = gridLine(vWorld.xz, 1.0);
    float l5 = gridLine(vWorld.xz, 5.0);
    float d = distance(vWorld, cameraPosition);
    float fade = exp(-pow(d * 0.0075, 2.0));
    float pulse = 0.5 + 0.5 * sin(vWorld.z * 0.12 + uTime * 1.5);
    float a = (l1 * 0.2 + l5 * 0.55) * fade * uOpacity * (0.7 + 0.3 * pulse);
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

const POINT_VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uScale;
  uniform vec3 uC1;
  uniform vec3 uC2;
  varying float vA;
  varying vec3 vC;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.4 + aSeed * 40.0) * 0.25;
    p.x += cos(uTime * 0.3 + aSeed * 25.0) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    gl_PointSize = clamp(aSize * uScale / max(dist, 0.1), 1.0, 7.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.35 + 0.65 * fract(aSeed * 7.0 + uTime * 0.05 * fract(aSeed * 3.0));
    vA = exp(-pow(dist * 0.0085, 2.0)) * twinkle * smoothstep(0.3, 2.5, dist);
    vC = mix(uC1, uC2, step(0.7, fract(aSeed * 13.0)));
  }
`;

const POINT_FRAG = /* glsl */ `
  varying float vA;
  varying vec3 vC;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d) * vA;
    gl_FragColor = vec4(vC, a);
    #include <colorspace_fragment>
  }
`;

function glyphTexture(seed: number) {
  const rand = mulberry32(seed);
  const { canvas, ctx } = makeCanvas(512, 512);
  const chars = "0123456789ABCDEF{}<>/=;:+*";
  const cols = 32;
  const rows = 18;
  const cw = 512 / cols;
  const rh = 512 / rows;
  ctx.font = `${Math.floor(rh * 0.7)}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let c = 0; c < cols; c++) {
    if (rand() < 0.35) continue;
    const head = Math.floor(rand() * rows);
    const len = 4 + Math.floor(rand() * 10);
    for (let k = 0; k < len; k++) {
      const r = (head - k + rows) % rows;
      const ch = chars[Math.floor(rand() * chars.length)];
      const a = k === 0 ? 0.95 : Math.max(0.08, 0.6 - k * 0.055);
      ctx.fillStyle =
        k === 0 ? `rgba(176,226,200,${a})` : `rgba(48,160,120,${a})`;
      ctx.fillText(ch, c * cw + cw / 2, r * rh + rh / 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function hudTexture(kind: number) {
  const rand = mulberry32(900 + kind * 31);
  const { canvas, ctx } = makeCanvas(512, 320);
  const mono = "ui-monospace, Menlo, Consolas, monospace";
  const titles = [
    "NODE MAP", "PACKET FLOW", "AUTH LOG", "THROUGHPUT",
    "HEX DUMP", "ENCRYPTION", "TOPOLOGY", "PROCESSES",
  ];

  ctx.fillStyle = "rgba(2,10,7,0.9)";
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = "#1d5a43";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 510, 318);
  ctx.fillStyle = "#0a1d15";
  ctx.fillRect(2, 2, 508, 34);
  ctx.fillStyle = "#a9d6bd";
  ctx.font = `bold 18px ${mono}`;
  ctx.fillText(titles[kind % 8], 16, 26);
  ctx.fillStyle = "#4fae80";
  ctx.beginPath();
  ctx.arc(488, 19, 5, 0, Math.PI * 2);
  ctx.fill();

  const green = "#4fae80";
  const teal = "#3d9e98";
  const dim = "#3f6b57";
  ctx.lineWidth = 1.5;

  switch (kind % 8) {
    case 0: {
      const pts = Array.from({ length: 16 }, () => [
        30 + rand() * 450,
        56 + rand() * 240,
      ]);
      ctx.strokeStyle = "rgba(61,158,152,0.5)";
      pts.forEach((p, i) => {
        const q = pts[(i * 5 + 3) % pts.length];
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(q[0], q[1]);
        ctx.stroke();
      });
      pts.forEach((p) => {
        ctx.fillStyle = green;
        ctx.fillRect(p[0] - 4, p[1] - 4, 8, 8);
      });
      break;
    }
    case 1: {
      for (let i = 0; i < 28; i++) {
        const h = 20 + rand() * 200;
        ctx.fillStyle = i % 6 === 0 ? teal : green;
        ctx.fillRect(22 + i * 17, 300 - h, 11, h);
      }
      break;
    }
    case 2: {
      ctx.font = `15px ${mono}`;
      const lines = ["token accepted", "session 0x4F2A open", "scope=root", "mfa ok", "key exchange done", "policy: allow", "audit logged", "ratelimit 0/s", "ip 10.8.0.14"];
      lines.forEach((l, i) => {
        ctx.fillStyle = i % 4 === 3 ? "#a8956a" : green;
        ctx.fillText(`[${String(i * 3 + 11).padStart(2, "0")}:2${i}] ${l}`, 18, 66 + i * 27);
      });
      break;
    }
    case 3: {
      for (let s = 0; s < 3; s++) {
        ctx.strokeStyle = [green, teal, "#a9d6bd"][s];
        ctx.beginPath();
        for (let i = 0; i < 60; i++) {
          const y = 190 + Math.sin(i * 0.25 + s * 2 + kind) * (40 + s * 10) + (rand() - 0.5) * 18 - s * 20;
          if (i === 0) ctx.moveTo(18, y);
          else ctx.lineTo(18 + i * 8.2, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 4: {
      ctx.font = `14px ${mono}`;
      for (let r = 0; r < 9; r++) {
        let row = (0x4f00 + r * 16).toString(16).padStart(4, "0") + "  ";
        for (let c = 0; c < 12; c++) {
          row += Math.floor(rand() * 256).toString(16).padStart(2, "0") + " ";
        }
        ctx.fillStyle = r % 3 === 0 ? "#a9d6bd" : green;
        ctx.fillText(row, 14, 62 + r * 27);
      }
      break;
    }
    case 5: {
      ctx.strokeStyle = teal;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(130, 180, 70, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = green;
      ctx.beginPath();
      ctx.arc(130, 180, 70, -Math.PI / 2, Math.PI * 0.9);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "#a9d6bd";
      ctx.font = `bold 22px ${mono}`;
      ctx.fillText("AES-256", 250, 120);
      ctx.fillStyle = dim;
      ctx.font = `15px ${mono}`;
      ["GCM  active", "RSA-4096  ok", "SHA-512  ok", "TLS 1.3"].forEach((l, i) => ctx.fillText(l, 250, 156 + i * 28));
      break;
    }
    case 6: {
      ctx.strokeStyle = "rgba(61,158,152,0.6)";
      const root = [256, 70];
      for (let i = 0; i < 4; i++) {
        const a = [60 + i * 130, 170];
        ctx.beginPath();
        ctx.moveTo(root[0], root[1]);
        ctx.lineTo(a[0], a[1]);
        ctx.stroke();
        for (let j = 0; j < 2; j++) {
          const b = [a[0] - 30 + j * 60, 270];
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
          ctx.fillStyle = green;
          ctx.fillRect(b[0] - 5, b[1] - 5, 10, 10);
        }
        ctx.fillStyle = teal;
        ctx.fillRect(a[0] - 6, a[1] - 6, 12, 12);
      }
      ctx.fillStyle = "#a9d6bd";
      ctx.fillRect(root[0] - 8, root[1] - 8, 16, 16);
      break;
    }
    default: {
      ctx.font = `14px ${mono}`;
      ["gatewayd", "tls-proxy", "ids-engine", "sync-agent", "key-vault", "logshipper"].forEach((n, i) => {
        ctx.fillStyle = "#a9d6bd";
        ctx.fillText(n, 18, 66 + i * 38);
        ctx.fillStyle = "#0b1d15";
        ctx.fillRect(190, 52 + i * 38, 300, 12);
        ctx.fillStyle = i === 2 ? "#a8956a" : green;
        ctx.fillRect(190, 52 + i * 38, 40 + rand() * 240, 12);
      });
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function gateTextTexture() {
  const { canvas, ctx } = makeCanvas(1024, 256);
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(79,174,128,0.8)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#b5e3cb";
  ctx.font = "bold 120px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText("IEI × ISTE", 512, 130);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#4f8a70";
  ctx.font = "28px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText("NMAM INSTITUTE OF TECHNOLOGY  ·  NITTE", 512, 196);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function dotTexture() {
  const { canvas, ctx } = makeCanvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.8)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function glowTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(160,230,195,0.9)");
  g.addColorStop(0.25, "rgba(60,160,120,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDigitalWorld() {
  const rand = mulberry32(2026);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#010504");
  scene.fog = new THREE.FogExp2("#010504", 0.0055);

  const lineBase = { transparent: true, toneMapped: false } as const;

  // ---------- Tunnel frames ----------
  const minor: number[] = [];
  const major: number[] = [];
  let ringIndex = 0;
  for (let z = TUNNEL_START; z >= TUNNEL_END; z -= 6) {
    const target = ringIndex % 5 === 0 ? major : minor;
    for (let k = 0; k < PROFILE.length; k++) {
      const a = PROFILE[k];
      const b = PROFILE[(k + 1) % PROFILE.length];
      target.push(a[0], a[1], z, b[0], b[1], z);
    }
    ringIndex++;
  }
  const longitudinal: number[] = [];
  PROFILE.forEach((p) => longitudinal.push(p[0], p[1], TUNNEL_START, p[0], p[1], TUNNEL_END));

  const makeLines = (verts: number[], color: string, opacity: number) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const mat = new THREE.LineBasicMaterial({
      color,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      ...lineBase,
    });
    const lines = new THREE.LineSegments(geo, mat);
    scene.add(lines);
    return lines;
  };
  makeLines(minor, "#176b50", 0.5);
  makeLines(major, "#2f9f80", 0.8);
  makeLines(longitudinal, "#1f7d63", 0.55);

  // ---------- Grid floor and ceiling ----------
  const gridUniforms: THREE.ShaderMaterial[] = [];
  const makeGrid = (y: number, color: string, opacity: number) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: GRID_VERT,
      fragmentShader: GRID_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
        uOpacity: { value: opacity },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 400), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, y, (TUNNEL_START + TUNNEL_END) / 2);
    scene.add(mesh);
    gridUniforms.push(mat);
  };
  makeGrid(-3, "#2f9f80", 1);
  makeGrid(4.2, "#1f7d63", 0.45);

  // ---------- Code stream walls ----------
  const glyphA = glyphTexture(11);
  const glyphB = glyphTexture(47);
  const glyphGeo = new THREE.PlaneGeometry(7, 3.6);
  const makeGlyphMat = (map: THREE.Texture) =>
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
  const glyphMats = [makeGlyphMat(glyphA), makeGlyphMat(glyphB)];
  const glyphPlanes: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    [-1, 1].forEach((side, s) => {
      const m = new THREE.Mesh(glyphGeo, glyphMats[(i + s) % 2]);
      glyphPlanes.push(m);
      m.position.set(side * 5.93, 0.6, -14 - i * 29 - (s ? 14 : 0));
      m.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(m);
    });
  }

  // ---------- Data particles ----------
  const PARTICLES = 3600;
  const pPos = new Float32Array(PARTICLES * 3);
  const pSeed = new Float32Array(PARTICLES);
  const pSize = new Float32Array(PARTICLES);
  for (let i = 0; i < PARTICLES; i++) {
    pPos[i * 3] = (rand() - 0.5) * 11;
    pPos[i * 3 + 1] = -2.8 + rand() * 6.8;
    pPos[i * 3 + 2] = 8 - rand() * 400;
    pSeed[i] = rand();
    pSize[i] = 0.7 + rand() * 1.6;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(pSeed, 1));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
  const particleMat = new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 500 },
      uC1: { value: new THREE.Color("#4fae80") },
      uC2: { value: new THREE.Color("#7fd0c8") },
    },
  });
  const particles = new THREE.Points(pGeo, particleMat);
  particles.frustumCulled = false;
  scene.add(particles);

  // ---------- Network graph ----------
  const NODE_COUNT = 72;
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(
      new THREE.Vector3(
        (rand() - 0.5) * 9.4,
        -2.2 + rand() * 5.6,
        -24 - rand() * (DEPTH_MAX + 20)
      )
    );
  }
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((n, i) => {
    nodes
      .map((m, j) => ({ j, d: n.distanceTo(m) }))
      .filter((o) => o.j !== i && o.d < 48)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push([i, j]);
        }
      });
  });
  const edgeVerts: number[] = [];
  edges.forEach(([a, b]) =>
    edgeVerts.push(nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z)
  );
  makeLines(edgeVerts, "#2a8c8a", 0.28);

  const dot = dotTexture();
  const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodes);
  scene.add(
    new THREE.Points(
      nodeGeo,
      new THREE.PointsMaterial({
        color: "#9fd6bd",
        map: dot,
        size: 4,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    )
  );

  const PULSES = 56;
  const PARTICLE_TOTAL = PARTICLES;
  const pulseState = Array.from({ length: PULSES }, () => ({
    edge: Math.floor(rand() * edges.length),
    t: rand(),
    speed: 0.08 + rand() * 0.18,
  }));
  const pulsePos = new Float32Array(PULSES * 3);
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
  const pulses = new THREE.Points(
    pulseGeo,
    new THREE.PointsMaterial({
      color: "#c3efdc",
      map: dot,
      size: 4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  pulses.frustumCulled = false;
  scene.add(pulses);

  // ---------- Wireframe structures ----------
  const shapeGeos: THREE.BufferGeometry[] = [
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.4, 1)),
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.7)),
    new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(1.4)),
    new THREE.WireframeGeometry(new THREE.TorusKnotGeometry(0.9, 0.22, 72, 8)),
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 2.4, 2.4)),
    new THREE.WireframeGeometry(new THREE.TorusGeometry(1.3, 0.35, 10, 28)),
  ];
  const shapeMat = new THREE.LineBasicMaterial({
    color: "#2f9b78",
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    ...lineBase,
  });
  const shapes: { mesh: THREE.LineSegments; spin: THREE.Vector3 }[] = [];
  for (let i = 0; i < 16; i++) {
    const mesh = new THREE.LineSegments(shapeGeos[i % shapeGeos.length], shapeMat);
    const side = i % 2 === 0 ? -1 : 1;
    mesh.position.set(side * (2.9 + rand() * 1.5), -1 + rand() * 3.6, -28 - i * 20);
    mesh.scale.setScalar(0.8 + rand() * 0.6);
    scene.add(mesh);
    shapes.push({
      mesh,
      spin: new THREE.Vector3(rand() * 0.3, 0.15 + rand() * 0.3, rand() * 0.2),
    });
  }

  // ---------- Floating system interfaces ----------
  const hudGeo = new THREE.PlaneGeometry(3.4, 2.125);
  const hudEdgeGeo = new THREE.EdgesGeometry(hudGeo);
  const hudEdgeMat = new THREE.LineBasicMaterial({
    color: "#2c8f6d",
    opacity: 0.7,
    ...lineBase,
  });
  const huds: { group: THREE.Group; baseY: number; phase: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const group = new THREE.Group();
    const side = i % 2 === 0 ? -1 : 1;
    const baseY = 0.2 + (i % 3) * 0.8;
    group.position.set(side * 4.1, baseY, -36 - i * 36);
    group.rotation.y = -side * 0.35;
    const panel = new THREE.Mesh(
      hudGeo,
      new THREE.MeshBasicMaterial({
        map: hudTexture(i),
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        toneMapped: false,
      })
    );
    group.add(panel);
    group.add(new THREE.LineSegments(hudEdgeGeo, hudEdgeMat));
    scene.add(group);
    huds.push({ group, baseY, phase: rand() * 6 });
  }

  // ---------- Gateway ----------
  const gate = new THREE.Group();
  gate.position.set(0, 0.6, GATE_Z);
  scene.add(gate);

  const ringSpecs: [number, string, number][] = [
    [9, "#2a8c70", 0.12],
    [6.4, "#2f9f9a", -0.2],
    [4.2, "#58b99a", 0.3],
  ];
  const gateRings = ringSpecs.map(([radius, color, spin]) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.09, 8, 128),
      new THREE.MeshBasicMaterial({ color, toneMapped: false })
    );
    gate.add(ring);
    return { ring, spin };
  });
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.6, 1),
    new THREE.MeshBasicMaterial({
      color: "#3fa27f",
      wireframe: true,
      transparent: true,
      opacity: 0.7,
      toneMapped: false,
    })
  );
  gate.add(core);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    })
  );
  glow.scale.setScalar(44);
  gate.add(glow);
  const gateText = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 5),
    new THREE.MeshBasicMaterial({
      map: gateTextTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  );
  gateText.position.set(0, -0.2, 0.4);
  gate.add(gateText);

  // ---------- Update ----------
  let lastTime = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  function update(time: number) {
    const dt = Math.min(0.1, Math.max(0, time - lastTime));
    lastTime = time;

    particleMat.uniforms.uTime.value = time;
    gridUniforms.forEach((m) => (m.uniforms.uTime.value = time));

    glyphA.offset.y -= dt * 0.22;
    glyphB.offset.y -= dt * 0.34;

    shapes.forEach(({ mesh, spin }) => {
      mesh.rotation.x += spin.x * dt;
      mesh.rotation.y += spin.y * dt;
      mesh.rotation.z += spin.z * dt;
    });

    huds.forEach((h) => {
      h.group.position.y = h.baseY + Math.sin(time * 0.6 + h.phase) * 0.08;
    });

    gateRings.forEach(({ ring, spin }) => (ring.rotation.z += spin * dt));
    core.rotation.x += dt * 0.2;
    core.rotation.y += dt * 0.35;
    glow.material.opacity = 0.36 + Math.sin(time * 1.2) * 0.05;

    pulseState.forEach((p, i) => {
      p.t += p.speed * dt;
      if (p.t > 1) {
        p.t = 0;
        p.edge = Math.floor(rand() * edges.length);
      }
      const [ea, eb] = edges[p.edge];
      a.copy(nodes[ea]);
      b.copy(nodes[eb]);
      a.lerp(b, p.t);
      pulsePos[i * 3] = a.x;
      pulsePos[i * 3 + 1] = a.y;
      pulsePos[i * 3 + 2] = a.z;
    });
    pulseGeo.attributes.position.needsUpdate = true;
  }

  /**
   * Adjusts density without rebuilding anything. density 1 = full desktop
   * scene (the default, unchanged); lower values trim particles, floating
   * panels, wireframes, code walls and network pulses.
   */
  function setQuality(density: number) {
    const reduced = density < 1;
    pGeo.setDrawRange(0, Math.floor(PARTICLE_TOTAL * density));
    pulseGeo.setDrawRange(0, Math.floor(PULSES * Math.max(density, 0.4)));
    huds.forEach((h, i) => (h.group.visible = !reduced || i % 4 < 2));
    shapes.forEach(({ mesh }, i) => (mesh.visible = !reduced || i % 2 === 0));
    glyphPlanes.forEach((m, i) => (m.visible = !reduced || i % 2 === 0));
  }

  return {
    scene,
    update,
    setQuality,
    /** Point-size scale; pass the render-target height in pixels. */
    setViewportHeight(h: number) {
      particleMat.uniforms.uScale.value = h * 0.55;
    },
    dispose() {
      disposeObject(scene);
      shapeGeos.forEach((g) => g.dispose());
      hudEdgeGeo.dispose();
      hudGeo.dispose();
      glyphGeo.dispose();
      glyphMats.forEach((m) => m.dispose());
      glyphA.dispose();
      glyphB.dispose();
      nodeGeo.dispose();
      dot.dispose();
    },
  };
}

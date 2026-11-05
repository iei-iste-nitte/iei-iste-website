import * as THREE from "three";
import { createTerminal, SCREEN_ASPECT } from "./terminal";
import { createRoom, SCREEN_W, SCREEN_H } from "./room";
import { createDigitalWorld, DEPTH_MAX } from "./digital";
import { disposeObject, smoothstep } from "./util";

/**
 * Scroll-driven state. Each field is owned by exactly one tween so the two
 * ScrollTrigger timelines can never fight over the same property.
 */
export interface JourneyState {
  door: number; // 0..1  door swing
  walk: number; // 0..1  camera path from hallway to the laptop
  approach: number; // 0..1  dolly onto the screen's normal axis
  mix: number; // 0..1  terminal -> digital world dissolve on the screen
  depthPre: number; // 0..PRE  digital camera drift while still inside the screen
  depthMain: number; // 0..(DEPTH_MAX-PRE)  travel after the portal swap
}

export const DEPTH_PRE_MAX = 10;
export const DEPTH_MAIN_MAX = DEPTH_MAX - DEPTH_PRE_MAX;

const RT_FOV = 58;

/** Rendering budget. Desktop values are the original, unchanged settings. */
interface QualityProfile {
  mobile: boolean;
  maxPixelRatio: number;
  density: number; // particles / panels / wireframes (1 = full)
  shadows: boolean;
  rtWidth: number; // portal render-target width
  rtSamples: number; // portal MSAA samples
  terminalInterval: number; // seconds between terminal redraws
}

const DESKTOP: QualityProfile = {
  mobile: false, maxPixelRatio: 1.25, density: 1, shadows: true,
  rtWidth: 1536, rtSamples: 4, terminalInterval: 0.07,
};
const MOBILE: QualityProfile = {
  mobile: true, maxPixelRatio: 1, density: 0.35, shadows: false,
  rtWidth: 768, rtSamples: 2, terminalInterval: 0.1,
};

function detectProfile(): QualityProfile {
  const narrow = window.matchMedia("(max-width: 820px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const smallSide = Math.min(window.innerWidth, window.innerHeight) <= 820;
  return narrow || (coarse && smallSide) ? MOBILE : DESKTOP;
}
const rad = THREE.MathUtils.degToRad;
const deg = THREE.MathUtils.radToDeg;

const SCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCREEN_FRAG = /* glsl */ `
  uniform sampler2D uTerm;
  uniform sampler2D uDig;
  uniform float uMix;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(1.6, 1.0);
    float r = length(p);

    float edge = uMix * 1.3;
    float w = 0.14;
    float inside = 1.0 - smoothstep(edge - w, edge, r);
    float going = step(0.001, uMix) * (1.0 - step(0.999, uMix));
    float ring = exp(-pow((r - edge + w * 0.5) / (w * 0.55), 2.0)) * going;

    vec2 dir = normalize(p + vec2(1e-5));
    vec2 off = dir * 0.006 * ring;
    vec3 dig = vec3(
      texture2D(uDig, uv + off).r,
      texture2D(uDig, uv).g,
      texture2D(uDig, uv - off).b
    );
    vec3 term = texture2D(uTerm, uv).rgb;

    vec3 col = mix(term, dig, inside);
    col += vec3(0.03, 0.22, 0.16) * ring;

    // glass / CRT feel, fully faded once the portal has opened
    float fx = 1.0 - uMix;
    float scan = 0.955 + 0.045 * sin(uv.y * 780.0 + uTime * 2.0);
    float vig = 1.0 - 0.35 * smoothstep(0.35, 0.95, r);
    col *= mix(1.0, scan * vig, fx);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createScene(container: HTMLElement) {
  // ---------- Renderer ----------
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const canvas = renderer.domElement;
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());

  const size = () => ({
    w: Math.max(1, container.clientWidth || window.innerWidth),
    h: Math.max(1, container.clientHeight || window.innerHeight),
  });

  // ---------- Portal render target (digital world seen through the screen) ----------
  const floatOk =
    renderer.extensions.has("EXT_color_buffer_float") ||
    renderer.extensions.has("EXT_color_buffer_half_float");
  let profile = detectProfile();
  const rt = new THREE.WebGLRenderTarget(
    profile.rtWidth,
    Math.round(profile.rtWidth / SCREEN_ASPECT),
    {
      samples: profile.rtSamples,
      type: floatOk ? THREE.HalfFloatType : THREE.UnsignedByteType,
    }
  );

  // ---------- Content ----------
  const terminal = createTerminal();
  terminal.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const screenMaterial = new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
    toneMapped: false,
    uniforms: {
      uTerm: { value: terminal.texture },
      uDig: { value: rt.texture },
      uMix: { value: 0 },
      uTime: { value: 0 },
    },
  });

  const room = createRoom(screenMaterial);
  const digital = createDigitalWorld();

  const roomScene = new THREE.Scene();
  roomScene.background = new THREE.Color("#030504");
  roomScene.fog = new THREE.FogExp2("#030504", 0.045);
  roomScene.add(room.group);

  // Dim studio environment so metal and the polished floor have something to reflect
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 14),
      new THREE.MeshBasicMaterial({ color: "#040706", side: THREE.BackSide })
    )
  );
  const envPanel = (color: string, gain: number, w: number, h: number, pos: [number, number, number], rot: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(gain), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.rotation.set(...rot);
    envScene.add(m);
  };
  envPanel("#b4cbc2", 5, 5, 1.2, [0, 2.8, 0], [Math.PI / 2, 0, 0]);
  envPanel("#2f8f6c", 3, 6, 0.6, [-5.9, 1.2, 0], [0, Math.PI / 2, 0]);
  envPanel("#6f8f9a", 2, 3, 1.5, [5.9, 1.5, -2], [0, -Math.PI / 2, 0]);
  const envTarget = pmrem.fromScene(envScene, 0.03);
  roomScene.environment = envTarget.texture;
  roomScene.environmentIntensity = 0.45;
  disposeObject(envScene);
  pmrem.dispose();

  // ---------- Cameras ----------
  const roomCam = new THREE.PerspectiveCamera(42, 1, 0.02, 40);
  const digCam = new THREE.PerspectiveCamera(RT_FOV, SCREEN_ASPECT, 0.1, 900);

  // ---------- Screen anchor (centre + outward normal) ----------
  room.group.updateMatrixWorld(true);
  const screenCenter = new THREE.Vector3();
  room.screen.getWorldPosition(screenCenter);
  const screenNormal = new THREE.Vector3(0, 0, 1)
    .transformDirection(room.screen.matrixWorld)
    .normalize();

  // ---------- Walk path ----------
  const walkCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0.0, 1.5, 3.7),
      new THREE.Vector3(0.0, 1.52, 2.0),
      new THREE.Vector3(0.0, 1.52, 0.6),
      new THREE.Vector3(-0.05, 1.5, -1.0),
      new THREE.Vector3(-0.25, 1.38, -2.8),
      new THREE.Vector3(screenCenter.x, 1.2, screenCenter.z + 1.85),
    ],
    false,
    "centripetal"
  );
  const lookCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 1.1, 0),
      new THREE.Vector3(0, 1.15, -2.0),
      new THREE.Vector3(0, 1.2, -4.0),
      new THREE.Vector3(-0.1, 1.1, -5.5),
      new THREE.Vector3(-0.3, 1.0, -6.4),
      screenCenter.clone(),
    ],
    false,
    "centripetal"
  );

  const state: JourneyState = {
    door: 0, walk: 0, approach: 0, mix: 0, depthPre: 0, depthMain: 0,
  };

  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const pEnd = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function poseRoomCamera() {
    const w = THREE.MathUtils.clamp(state.walk, 0, 1);
    walkCurve.getPoint(w, camPos);
    lookCurve.getPoint(w, lookAt);

    // Portrait phones: the horizontal field of view is narrow, so stand a
    // little further back at the door and walk closer to the laptop. This is
    // zero for any landscape aspect, leaving desktop framing untouched.
    const portrait = THREE.MathUtils.clamp((1 - roomCam.aspect) / 0.4, 0, 1);
    if (portrait > 0) {
      camPos.z += 0.8 * portrait * (1 - smoothstep(0, 0.3, w));
      camPos.lerp(screenCenter, 0.16 * portrait * smoothstep(0.55, 1, w));
    }

    if (state.approach > 0) {
      const e = THREE.MathUtils.clamp(state.approach, 0, 1);
      const t = Math.tan(rad(roomCam.fov / 2));
      const dFill =
        0.985 * Math.min(SCREEN_W / (2 * t * roomCam.aspect), SCREEN_H / (2 * t));
      pEnd.copy(screenCenter).addScaledVector(screenNormal, dFill);
      camPos.lerp(pEnd, e);
      camPos.y += Math.sin(Math.PI * e) * 0.02;
      lookAt.lerp(screenCenter, e);
    }
    // On wide screens, frame the door right of centre so the hero copy
    // (left aligned) doesn't sit on top of it; eases out as we walk in.
    const shift = THREE.MathUtils.clamp((roomCam.aspect - 1.15) * 1.2, 0, 0.85);
    lookAt.x -= shift * (1 - smoothstep(0, 0.22, w)) * (1 - state.approach);
    roomCam.position.copy(camPos);
    roomCam.lookAt(lookAt);
  }

  function poseDigitalCamera(depth: number) {
    const sway = smoothstep(0, 60, depth);
    const x = Math.sin(depth * 0.021) * 0.7 * sway;
    const y = 0.4 + Math.sin(depth * 0.015 + 1) * 0.3 * sway;
    digCam.position.set(x, y, -depth);
    tmp.set(x * 0.4, 0.4 + (y - 0.4) * 0.5, -depth - 30);
    digCam.up.set(0, 1, 0);
    digCam.lookAt(tmp);
    digCam.rotateZ(Math.sin(depth * 0.01) * 0.035 * sway);
  }

  /** Vertical FOV for the full-screen digital camera: matches what the
   *  screen showed at the moment of hand-off, then opens up gradually. */
  function directFov(depth: number, aspect: number) {
    const matched = deg(
      2 * Math.atan(Math.tan(rad(RT_FOV / 2)) * Math.min(1, SCREEN_ASPECT / aspect))
    );
    const target = aspect < 1 ? 72 : 64;
    return THREE.MathUtils.lerp(matched, target, smoothstep(DEPTH_PRE_MAX, 70, depth));
  }

  // ---------- Quality, resize ----------
  // Adaptive fallback: if a phone sustains < ~33 fps we drop to 1x pixel
  // ratio and a lighter scene. Never applies to the desktop profile.
  let degraded = false;
  let reducedMotion = false;
  let needsFrame = true;
  let qualityKey = "";
  let rtHeight = Math.round(profile.rtWidth / SCREEN_ASPECT);

  function applyQuality() {
    profile = detectProfile();
    const useLite = profile.mobile && degraded;
    const key = `${profile.mobile}|${useLite}|${window.devicePixelRatio}`;
    if (key === qualityKey) return;
    qualityKey = key;

    const pr = useLite
      ? 1
      : Math.min(window.devicePixelRatio || 1, profile.maxPixelRatio);
    if (renderer.getPixelRatio() !== pr) renderer.setPixelRatio(pr);

    digital.setQuality(profile.density * (useLite ? 0.7 : 1));
    room.setQuality(profile.shadows);

    const rtW = useLite ? 768 : profile.rtWidth;
    if (rt.width !== rtW) {
      rtHeight = Math.round(rtW / SCREEN_ASPECT);
      rt.setSize(rtW, rtHeight);
    }
    if (rt.samples !== profile.rtSamples) {
      rt.samples = profile.rtSamples;
      rt.dispose(); // re-allocated lazily with the new sample count
    }
    needsFrame = true;
  }

  let lastW = 0;
  let lastH = 0;

  /** Cheap and idempotent: safe to call from resize, orientationchange and
   *  ResizeObserver without ever rebuilding the scene. */
  function resize() {
    applyQuality();
    const { w, h } = size();
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;

    renderer.setSize(w, h, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const aspect = w / h;
    roomCam.aspect = aspect;
    roomCam.fov =
      aspect >= 1.2
        ? 42
        : Math.min(72, deg(2 * Math.atan(Math.tan(rad(21)) * (1.2 / aspect))));
    roomCam.updateProjectionMatrix();
    needsFrame = true;
  }

  function setReducedMotion(value: boolean) {
    reducedMotion = value;
    needsFrame = true;
  }

  // ---------- Render ----------
  let lastTerminal = -1;
  let renderedOnce = false;
  let lastKey = "";
  let lastFrameAt = performance.now();
  let frameEma = 16;
  let slowFrames = 0;

  function isDirect() {
    return state.approach >= 0.999 && state.mix >= 0.999;
  }

  function watchPerformance() {
    const now = performance.now();
    const dt = now - lastFrameAt;
    lastFrameAt = now;
    if (dt > 250) return; // ignore tab-switch / scroll-jank gaps
    frameEma = frameEma * 0.95 + dt * 0.05;
    if (!profile.mobile || degraded) return;
    slowFrames = frameEma > 30 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
    if (slowFrames > 150) {
      degraded = true;
      applyQuality();
    }
  }

  function render(rawTime: number) {
    const t = reducedMotion ? 0 : rawTime;
    const { w, h } = size();
    const pr = renderer.getPixelRatio();

    if (reducedMotion) {
      // Nothing animates on its own: only draw when scroll/size changed.
      const key = [
        state.door, state.walk, state.approach, state.mix,
        state.depthPre, state.depthMain, w, h, pr,
      ].join("|");
      if (key === lastKey && !needsFrame) return;
      lastKey = key;
    } else {
      watchPerformance();
    }
    needsFrame = false;

    if (isDirect()) {
      // The screen now fills the viewport: render the digital world on its own.
      const depth = state.depthPre + state.depthMain;
      digital.update(t);
      digital.setViewportHeight(h * pr);
      digCam.aspect = w / h;
      digCam.fov = directFov(depth, digCam.aspect);
      digCam.updateProjectionMatrix();
      poseDigitalCamera(depth);
      renderer.render(digital.scene, digCam);
      renderedOnce = true;
      return;
    }

    room.setDoor(state.door);
    room.update(t);
    screenMaterial.uniforms.uMix.value = state.mix;
    screenMaterial.uniforms.uTime.value = t;

    // The terminal is only visible once the door has started to open.
    if (
      (state.door > 0.02 || !renderedOnce) &&
      t - lastTerminal > profile.terminalInterval
    ) {
      lastTerminal = t;
      terminal.draw(t);
    }

    if (state.mix > 0.001) {
      digital.update(t);
      digital.setViewportHeight(rtHeight);
      digCam.aspect = SCREEN_ASPECT;
      digCam.fov = RT_FOV;
      digCam.updateProjectionMatrix();
      poseDigitalCamera(state.depthPre);
      renderer.setRenderTarget(rt);
      renderer.render(digital.scene, digCam);
      renderer.setRenderTarget(null);
    }

    poseRoomCamera();
    renderer.render(roomScene, roomCam);
    renderedOnce = true;
  }

  resize();
  render(0);

  function dispose() {
    disposeObject(roomScene);
    digital.dispose();
    terminal.dispose();
    screenMaterial.dispose();
    rt.dispose();
    envTarget.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  return { state, domElement: canvas, resize, render, setReducedMotion, dispose };
}

export type World = ReturnType<typeof createScene>;

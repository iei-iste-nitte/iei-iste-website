
import * as THREE from "three";
import { createTerminal, SCREEN_ASPECT } from "./terminal";
import { createRoom, SCREEN_W, SCREEN_H } from "./room";
import { createDigitalWorld, DEPTH_MAX } from "./digital";
import { disposeObject, smoothstep } from "./util";

/**
 * Scroll-driven state.
 */
export interface JourneyState {
  door: number;
  walk: number;
  approach: number;
  mix: number;
  depthPre: number;
  depthMain: number;
}

export const DEPTH_PRE_MAX = 10;
export const DEPTH_MAIN_MAX = DEPTH_MAX - DEPTH_PRE_MAX;

const RT_FOV = 58;

interface QualityProfile {
  mobile: boolean;
  maxPixelRatio: number;
  density: number;
  shadows: boolean;
  rtWidth: number;
  rtSamples: number;
  terminalInterval: number;
}

const DESKTOP: QualityProfile = {
  mobile: false,
  maxPixelRatio: 1.25,
  density: 1,
  shadows: true,
  rtWidth: 1536,
  rtSamples: 4,
  terminalInterval: 0.07,
};

const MOBILE: QualityProfile = {
  mobile: true,
  maxPixelRatio: 1,
  density: 0.35,
  shadows: false,
  rtWidth: 768,
  rtSamples: 2,
  terminalInterval: 0.1,
};

function detectProfile(): QualityProfile {
  const narrow = window.matchMedia("(max-width: 820px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const smallSide =
    Math.min(window.innerWidth, window.innerHeight) <= 820;

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

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
  });

  const size = () => ({
    w: Math.max(1, container.clientWidth || window.innerWidth),
    h: Math.max(1, container.clientHeight || window.innerHeight),
  });

  // ---------- Portal render target ----------
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

  terminal.texture.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy()
  );

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

  // ---------- Environment ----------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();

  envScene.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 14),
      new THREE.MeshBasicMaterial({
        color: "#040706",
        side: THREE.BackSide,
      })
    )
  );

  const envPanel = (
    color: string,
    gain: number,
    w: number,
    h: number,
    pos: [number, number, number],
    rot: [number, number, number]
  ) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(gain),
        side: THREE.DoubleSide,
      })
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

  const digCam = new THREE.PerspectiveCamera(
    RT_FOV,
    SCREEN_ASPECT,
    0.1,
    900
  );

  // ---------- Screen anchor ----------
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
    door: 0,
    walk: 0,
    approach: 0,
    mix: 0,
    depthPre: 0,
    depthMain: 0,
  };

  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const pEnd = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function poseRoomCamera() {
    const w = THREE.MathUtils.clamp(state.walk, 0, 1);

    walkCurve.getPoint(w, camPos);
    lookCurve.getPoint(w, lookAt);

    const portrait = THREE.MathUtils.clamp(
      (1 - roomCam.aspect) / 0.4,
      0,
      1
    );

    if (portrait > 0) {
      camPos.z +=
        0.8 * portrait * (1 - smoothstep(0, 0.3, w));

      camPos.lerp(
        screenCenter,
        0.16 * portrait * smoothstep(0.55, 1, w)
      );
    }

    if (state.approach > 0) {
      const e = THREE.MathUtils.clamp(state.approach, 0, 1);
      const t = Math.tan(rad(roomCam.fov / 2));

      const dFill =
        0.985 *
        Math.min(
          SCREEN_W / (2 * t * roomCam.aspect),
          SCREEN_H / (2 * t)
        );

      pEnd.copy(screenCenter).addScaledVector(screenNormal, dFill);

      camPos.lerp(pEnd, e);
      camPos.y += Math.sin(Math.PI * e) * 0.02;
      lookAt.lerp(screenCenter, e);
    }

    const shift = THREE.MathUtils.clamp(
      (roomCam.aspect - 1.15) * 1.2,
      0,
      0.85
    );

    lookAt.x -=
      shift *
      (1 - smoothstep(0, 0.22, w)) *
      (1 - state.approach);

    roomCam.position.copy(camPos);
    roomCam.lookAt(lookAt);
  }

  function poseDigitalCamera(depth: number) {
    const sway = smoothstep(0, 60, depth);
    const x = Math.sin(depth * 0.021) * 0.7 * sway;
    const y = 0.4 + Math.sin(depth * 0.015 + 1) * 0.3 * sway;

    digCam.position.set(x, y, -depth);

    tmp.set(
      x * 0.4,
      0.4 + (y - 0.4) * 0.5,
      -depth - 30
    );

    digCam.up.set(0, 1, 0);
    digCam.lookAt(tmp);
    digCam.rotateZ(Math.sin(depth * 0.01) * 0.035 * sway);
  }

  function directFov(depth: number, aspect: number) {
    const matched = deg(
      2 *
        Math.atan(
          Math.tan(rad(RT_FOV / 2)) *
            Math.min(1, SCREEN_ASPECT / aspect)
        )
    );

    const target = aspect < 1 ? 72 : 64;

    return THREE.MathUtils.lerp(
      matched,
      target,
      smoothstep(DEPTH_PRE_MAX, 70, depth)
    );
  }

  // ==========================================================
  // INTERACTION SYSTEM
  // ==========================================================

  const raycaster = new THREE.Raycaster();
  raycaster.params.Line = { threshold: 0.2 };

  const pointer = new THREE.Vector2();

  const dragPlane = new THREE.Plane();
  const dragOffset = new THREE.Vector3();
  const dragIntersection = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();

  let hoveredObject: THREE.Group | null = null;
  let draggedObject: THREE.Group | null = null;
  let activePointerId: number | null = null;

  const originalBodyCursor = document.body.style.cursor;

  function isDirect() {
    return state.approach >= 0.999 && state.mix >= 0.999;
  }

  function isPointerOverUI(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;

    return Boolean(
      target.closest(
        [
          "a",
          "button",
          "input",
          "textarea",
          "select",
          "label",
          "[role='button']",
          "[data-no-3d-interaction]",
        ].join(",")
      )
    );
  }

  function updatePointerPosition(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    pointer.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Feed cursor position to the observer eye.
    digital.setPointer(pointer.x, pointer.y);
  }

  function getInteractiveHit() {
    if (!isDirect()) return null;

    raycaster.setFromCamera(pointer, digCam);

    const hits = raycaster.intersectObjects(
      digital.interactiveObjects,
      true
    );

    if (!hits.length) return null;

    let object: THREE.Object3D | null = hits[0].object;

    while (object && !object.userData.draggable) {
      object = object.parent;
    }

    return object instanceof THREE.Group ? object : null;
  }

  function setHover(group: THREE.Group | null) {
    if (hoveredObject === group) return;

    hoveredObject = group;
    digital.setHovered(group);

    if (!draggedObject) {
      document.body.style.cursor = group ? "grab" : originalBodyCursor;
    }
  }

  function onPointerMove(event: PointerEvent) {
    updatePointerPosition(event);

    // Continue an active drag even if the pointer moves over another element.
    if (draggedObject && activePointerId === event.pointerId) {
      raycaster.setFromCamera(pointer, digCam);

      if (raycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
        draggedObject.position
          .copy(dragIntersection)
          .sub(dragOffset);

        // Keep the objects within the visible interaction area.
        draggedObject.position.x = THREE.MathUtils.clamp(
          draggedObject.position.x,
          -5,
          5
        );

        draggedObject.position.y = THREE.MathUtils.clamp(
          draggedObject.position.y,
          -1.5,
          4.5
        );

        draggedObject.position.z = THREE.MathUtils.clamp(
          draggedObject.position.z,
          -405,
          -370
        );
      }

      return;
    }

    if (!isDirect() || isPointerOverUI(event.target)) {
      setHover(null);
      return;
    }

    const hit = getInteractiveHit();
    setHover(hit);
  }

  function onPointerDown(event: PointerEvent) {
    if (!isDirect()) return;
    if (isPointerOverUI(event.target)) return;

    updatePointerPosition(event);

    const hit = getInteractiveHit();

    if (!hit) return;

    draggedObject = hit;
    activePointerId = event.pointerId;

    // Make a camera-facing plane through the selected object.
    digCam.getWorldDirection(cameraDirection);

    dragPlane.setFromNormalAndCoplanarPoint(
      cameraDirection,
      hit.position
    );

    // Preserve the point where the user grabbed the object.
    raycaster.setFromCamera(pointer, digCam);

    if (raycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
      dragOffset.copy(dragIntersection).sub(hit.position);
    } else {
      dragOffset.set(0, 0, 0);
    }

    setHover(hit);
    document.body.style.cursor = "grabbing";
  }

  function onPointerUp(event: PointerEvent) {
    if (activePointerId !== event.pointerId) return;

    draggedObject = null;
    activePointerId = null;

    document.body.style.cursor =
      hoveredObject ? "grab" : originalBodyCursor;
  }

  function onPointerCancel(event: PointerEvent) {
    if (activePointerId !== event.pointerId) return;

    draggedObject = null;
    activePointerId = null;

    setHover(null);
    document.body.style.cursor = originalBodyCursor;
  }

  function onWindowBlur() {
    draggedObject = null;
    activePointerId = null;

    setHover(null);
    document.body.style.cursor = originalBodyCursor;
  }

  // Listen on window because the background canvas may have
  // pointer-events: none so that the website remains clickable.
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
  window.addEventListener("blur", onWindowBlur);

  // ---------- Quality and resize ----------
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
      : Math.min(
          window.devicePixelRatio || 1,
          profile.maxPixelRatio
        );

    if (renderer.getPixelRatio() !== pr) {
      renderer.setPixelRatio(pr);
    }

    digital.setQuality(
      profile.density * (useLite ? 0.7 : 1)
    );

    room.setQuality(profile.shadows);

    const rtW = useLite ? 768 : profile.rtWidth;

    if (rt.width !== rtW) {
      rtHeight = Math.round(rtW / SCREEN_ASPECT);
      rt.setSize(rtW, rtHeight);
    }

    if (rt.samples !== profile.rtSamples) {
      rt.samples = profile.rtSamples;
      rt.dispose();
    }

    needsFrame = true;
  }

  let lastW = 0;
  let lastH = 0;

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
        : Math.min(
            72,
            deg(
              2 *
                Math.atan(
                  Math.tan(rad(21)) * (1.2 / aspect)
                )
            )
          );

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

  let paused = false;

  function setPaused(value: boolean) {
    paused = value;

    if (!value) {
      needsFrame = true;
    }
  }

  function watchPerformance() {
    const now = performance.now();
    const dt = now - lastFrameAt;

    lastFrameAt = now;

    if (dt > 250) return;

    frameEma = frameEma * 0.95 + dt * 0.05;

    if (!profile.mobile || degraded) return;

    slowFrames =
      frameEma > 30
        ? slowFrames + 1
        : Math.max(0, slowFrames - 2);

    if (slowFrames > 150) {
      degraded = true;
      applyQuality();
    }
  }

  function render(rawTime: number) {
    if (paused) return;

    const t = reducedMotion ? 0 : rawTime;

    const { w, h } = size();
    const pr = renderer.getPixelRatio();

    if (reducedMotion) {
      const key = [
        state.door,
        state.walk,
        state.approach,
        state.mix,
        state.depthPre,
        state.depthMain,
        w,
        h,
        pr,
      ].join("|");

      if (key === lastKey && !needsFrame) return;

      lastKey = key;
    } else {
      watchPerformance();
    }

    needsFrame = false;

    if (isDirect()) {
      const depth = state.depthPre + state.depthMain;

      digital.update(t);
      digital.setViewportHeight(h * pr);

      digCam.aspect = w / h;
      digCam.fov = directFov(depth, digCam.aspect);
      digCam.updateProjectionMatrix();

      poseDigitalCamera(depth);

      // Keep the camera matrices current for raycasting.
      digCam.updateMatrixWorld(true);

      renderer.render(digital.scene, digCam);

      renderedOnce = true;
      return;
    }

    room.setDoor(state.door);
    room.update(t);

    screenMaterial.uniforms.uMix.value = state.mix;
    screenMaterial.uniforms.uTime.value = t;

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

  // ---------- Initial setup ----------
  resize();
  render(0);

  // ---------- Cleanup ----------
  function dispose() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
    window.removeEventListener("blur", onWindowBlur);

    draggedObject = null;
    activePointerId = null;

    digital.setHovered(null);

    document.body.style.cursor = originalBodyCursor;

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

  return {
    state,
    domElement: canvas,
    resize,
    render,
    setReducedMotion,
    setPaused,
    dispose,
  };
}

export type World = ReturnType<typeof createScene>;

import * as THREE from "three";

export function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return { canvas, ctx };
}

/** Deterministic PRNG so generated textures look identical on every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Disposable = THREE.Mesh | THREE.Line | THREE.Points | THREE.Sprite;

function disposeMaterial(material: THREE.Material) {
  const record = material as unknown as Record<string, unknown>;
  for (const value of Object.values(record)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  const uniforms = (material as THREE.ShaderMaterial).uniforms;
  if (uniforms) {
    for (const uniform of Object.values(uniforms)) {
      if (uniform.value instanceof THREE.Texture) uniform.value.dispose();
    }
  }
  material.dispose();
}

/** Disposes every geometry, material and texture beneath `root`. */
export function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  root.traverse((object) => {
    const item = object as Disposable;
    if (item.geometry) geometries.add(item.geometry);
    if (item.material) {
      const list = Array.isArray(item.material)
        ? item.material
        : [item.material];
      list.forEach((m) => materials.add(m));
    }
    const instanced = object as THREE.InstancedMesh;
    if (instanced.isInstancedMesh) instanced.dispose();
  });

  geometries.forEach((g) => g.dispose());
  materials.forEach(disposeMaterial);
}

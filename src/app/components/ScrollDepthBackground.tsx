
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ScrollDepthBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080D18");
    scene.fog = new THREE.FogExp2("#080D18", 0.012);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );

    camera.position.set(0, 4, 15);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // MATERIALS
    const blueprintMaterial = new THREE.LineBasicMaterial({
      color: "#75A9D9",
      transparent: true,
      opacity: 0.48,
    });

    const brightMaterial = new THREE.LineBasicMaterial({
      color: "#B5D8F4",
      transparent: true,
      opacity: 0.72,
    });

    const subtleMaterial = new THREE.LineBasicMaterial({
      color: "#47769E",
      transparent: true,
      opacity: 0.25,
    });

    // HELPER: CREATE WIREFRAME OBJECT
    function wireframe(
      geometry: THREE.BufferGeometry,
      material: THREE.LineBasicMaterial,
      parent: THREE.Group,
      position: [number, number, number],
      rotation: [number, number, number] = [0, 0, 0]
    ) {
      const edges = new THREE.EdgesGeometry(geometry);
      const lines = new THREE.LineSegments(edges, material);

      lines.position.set(...position);
      lines.rotation.set(...rotation);

      parent.add(lines);
      return lines;
    }

    // =====================================
    // 1. MECHANICAL CAD ASSEMBLY
    // =====================================

    const machine = new THREE.Group();
    machine.position.set(0, 1.5, -3);
    scene.add(machine);

    // Central shaft
    wireframe(
      new THREE.CylinderGeometry(0.34, 0.34, 6.2, 24, 1, true),
      brightMaterial,
      machine,
      [0, 0, 0],
      [Math.PI / 2, 0, 0]
    );

    // Outer mechanical rings
    [-2.7, -1.7, 1.7, 2.7].forEach((z, index) => {
      const ring = new THREE.TorusGeometry(
        index % 2 === 0 ? 1.15 : 0.8,
        0.035,
        8,
        48
      );

      const torus = new THREE.LineSegments(
        new THREE.EdgesGeometry(ring),
        index % 2 === 0 ? brightMaterial : blueprintMaterial
      );

      torus.position.set(0, 0, z);
      machine.add(torus);
    });

    // Outer mechanical housing
    wireframe(
      new THREE.BoxGeometry(2.7, 2.7, 1.1),
      blueprintMaterial,
      machine,
      [0, 0, -3.3]
    );

    wireframe(
      new THREE.BoxGeometry(2.7, 2.7, 1.1),
      blueprintMaterial,
      machine,
      [0, 0, 3.3]
    );

    // Internal mechanical components
    [-1.1, 0, 1.1].forEach((z) => {
      wireframe(
        new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16, 1, true),
        subtleMaterial,
        machine,
        [0, 0, z],
        [Math.PI / 2, 0, 0]
      );
    });

    // Supporting rods
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;

      const x = Math.cos(angle) * 1.05;
      const y = Math.sin(angle) * 1.05;

      const rod = wireframe(
        new THREE.CylinderGeometry(0.025, 0.025, 6.5, 6),
        subtleMaterial,
        machine,
        [x, y, 0],
        [Math.PI / 2, 0, 0]
      );

      rod.rotation.z += angle;
    }

    // Mechanical outer rings
    wireframe(
      new THREE.CylinderGeometry(1.4, 1.4, 0.15, 32, 1, true),
      blueprintMaterial,
      machine,
      [0, 0, -3.9],
      [Math.PI / 2, 0, 0]
    );

    wireframe(
      new THREE.CylinderGeometry(1.4, 1.4, 0.15, 32, 1, true),
      blueprintMaterial,
      machine,
      [0, 0, 3.9],
      [Math.PI / 2, 0, 0]
    );

    // =====================================
    // 2. ARCHITECTURAL WIREFRAME CORRIDOR
    // =====================================

    const architecture = new THREE.Group();
    scene.add(architecture);

    // Building arrangement
    for (const side of [-1, 1]) {
      for (let i = 0; i < 24; i++) {
        const z = -18 - i * 4.3;
        const width = 2.2 + ((i * 7) % 4) * 0.45;
        const height = 3.5 + ((i * 13) % 6) * 0.85;
        const depth = 2.8 + ((i * 5) % 3);

        const x = side * (5.5 + (i % 3) * 0.8);

        const building = new THREE.Group();

        wireframe(
          new THREE.BoxGeometry(width, height, depth),
          blueprintMaterial,
          building,
          [0, height / 2, 0]
        );

        // Roof structures
        wireframe(
          new THREE.BoxGeometry(width * 0.7, 0.8, depth * 0.7),
          subtleMaterial,
          building,
          [0, height + 0.4, 0]
        );

        // Architectural subdivisions
        for (let j = 1; j < 4; j++) {
          const xPosition = -width / 2 + (width / 4) * j;

          wireframe(
            new THREE.BoxGeometry(0.015, height, 0.015),
            subtleMaterial,
            building,
            [xPosition, height / 2, depth / 2 + 0.01]
          );
        }

        building.position.set(x, 0, z);
        architecture.add(building);
      }
    }

    // =====================================
    // 3. ENGINEERING FLOOR GRID
    // =====================================

    const grid = new THREE.GridHelper(
      180,
      100,
      "#5685AD",
      "#284766"
    );

    grid.position.set(0, 0, -65);

    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.32;

    scene.add(grid);

    // =====================================
    // 4. TECHNICAL GUIDELINES
    // =====================================

    const technicalLines = new THREE.Group();

    for (let i = 0; i < 14; i++) {
      const x = -13 + i * 2;

      const points = [
        new THREE.Vector3(x, 0.015, 8),
        new THREE.Vector3(x, 0.015, -120),
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const line = new THREE.Line(geometry, subtleMaterial);
      technicalLines.add(line);
    }

    scene.add(technicalLines);

    // =====================================
    // 5. LIGHTING
    // =====================================

    const ambient = new THREE.AmbientLight("#8BAFD5", 0.7);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight("#A9D4F5", 1.2);
    directional.position.set(4, 8, 10);
    scene.add(directional);

    // =====================================
    // 6. SCROLL-BASED CAMERA MOVEMENT
    // =====================================

    let targetProgress = 0;
    let currentProgress = 0;

    const updateScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      targetProgress =
        maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    window.addEventListener("scroll", updateScroll, {
      passive: true,
    });

    updateScroll();

    // =====================================
    // 7. ANIMATION LOOP
    // =====================================

    const clock = new THREE.Clock();
    let animationFrame = 0;
    let active = true;

    const animate = () => {
      if (!active) return;

      animationFrame = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth scroll interpolation
      currentProgress += (targetProgress - currentProgress) * 0.055;

      // Travel through the engineering environment
      const travel = currentProgress * 95;

      camera.position.z = 15 - travel;
      camera.position.y = 3.5 + Math.sin(currentProgress * Math.PI) * 0.7;

      // Subtle camera movement
      camera.position.x = Math.sin(elapsed * 0.12) * 0.12;

      camera.lookAt(
        0,
        0,
        camera.position.z - 16
      );

      // Mechanical assembly rotation
      machine.rotation.z = Math.sin(elapsed * 0.18) * 0.035;
      machine.rotation.y = Math.sin(elapsed * 0.12) * 0.045;

      // Slight environmental movement
      architecture.position.y = Math.sin(elapsed * 0.15) * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // =====================================
    // 8. RESPONSIVE RESIZING
    // =====================================

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    };

    window.addEventListener("resize", handleResize);

    // =====================================
    // 9. CLEANUP
    // =====================================

    return () => {
      active = false;

      cancelAnimationFrame(animationFrame);

      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", handleResize);

      scene.traverse((object) => {
        if (object instanceof THREE.LineSegments || object instanceof THREE.Line) {
          object.geometry.dispose();
        }
      });

      blueprintMaterial.dispose();
      brightMaterial.dispose();
      subtleMaterial.dispose();

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="engineering-background"
      aria-hidden="true"
    >
      <div className="engineering-overlay" />
    </div>
  );
}



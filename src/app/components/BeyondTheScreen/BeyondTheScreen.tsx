

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createScene } from "./scene";

gsap.registerPlugin(ScrollTrigger);

export default function BeyondTheScreen() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const world = createScene(container);
    container.appendChild(world.renderer.domElement);

    const {
      camera,
      renderer,
      room,
      doorPivot,
      laptop,
      digitalWorld,
      terminalPanels,
      dataNodes,
      resize,
      update,
      dispose,
    } = world;

    const cameraTarget = {
      x: 0,
      y: 1.7,
      z: 0,
    };

    const look = () => {
      camera.lookAt(
        cameraTarget.x,
        cameraTarget.y,
        cameraTarget.z
      );
    };

    look();

    // =====================================
    // PHASE 1: OPEN THE DOOR AND ENTER ROOM
    // =====================================

    const roomTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        endTrigger: "#beyond-scroll-runway",
        end: "top bottom",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    roomTimeline
      .to(
        doorPivot.rotation,
        {
          y: -Math.PI / 2,
          duration: 1.4,
          ease: "power2.inOut",
        },
        0
      )
      .to(
        camera.position,
        {
          x: 0,
          y: 1.9,
          z: -1.5,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: look,
        },
        1
      )
      .to(
        cameraTarget,
        {
          x: 0,
          y: 1.7,
          z: -5.5,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: look,
        },
        1
      )
      .to(
        camera.position,
        {
          x: 0,
          y: 1.8,
          z: -4.4,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: look,
        },
        3
      )
      .to(
        cameraTarget,
        {
          x: 0,
          y: 1.8,
          z: -6.9,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: look,
        },
        3
      )
      .to(
        laptop.rotation,
        {
          x: -0.035,
          duration: 1,
          ease: "power1.inOut",
        },
        3.5
      );

    // =====================================
    // PHASE 2: ENTER THE LAPTOP SCREEN
    // =====================================

    const digitalTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "#beyond-scroll-runway",
        start: "top bottom",
        end: "bottom bottom",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // Reveal the digital world only after the camera
    // passes through the laptop screen.
    const switchWorld = () => {
      const hasEnteredScreen = camera.position.z < -7.15;

      room.visible = !hasEnteredScreen;
      digitalWorld.visible = hasEnteredScreen;
    };

    digitalTimeline
      .to(
        camera.position,
        {
          x: 0,
          y: 1.8,
          z: -7.4,
          duration: 1.2,
          ease: "power2.in",
          onUpdate: () => {
            look();
            switchWorld();
          },
        },
        0
      )
      .to(
        cameraTarget,
        {
          x: 0,
          y: 1.8,
          z: -12,
          duration: 1.2,
          ease: "power2.in",
          onUpdate: look,
        },
        0
      )
      .to(
        camera,
        {
          fov: 68,
          duration: 1.2,
          ease: "power2.in",
          onUpdate: () => camera.updateProjectionMatrix(),
        },
        0
      )
      .to(
        camera.position,
        {
          x: 0,
          y: 2,
          z: -20,
          duration: 2.5,
          ease: "power2.inOut",
          onUpdate: () => {
            look();
            switchWorld();
          },
        },
        1.2
      )
      .to(
        cameraTarget,
        {
          x: 0,
          y: 2,
          z: -32,
          duration: 2.5,
          ease: "power2.inOut",
          onUpdate: look,
        },
        1.2
      )
      .to(
        camera,
        {
          fov: 55,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => camera.updateProjectionMatrix(),
        },
        2
      )
      .to(
        camera.position,
        {
          z: -29,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: () => {
            look();
            switchWorld();
          },
        },
        3.7
      )
      .to(
        cameraTarget,
        {
          z: -45,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: look,
        },
        3.7
      );

    // =====================================
    // FLOATING TERMINAL PANELS
    // =====================================

    const floatingTweens: gsap.core.Tween[] = [];

    terminalPanels.forEach((panel, index) => {
      const tween = gsap.to(panel.position, {
        y: panel.position.y + (index % 2 === 0 ? 0.16 : -0.16),
        duration: 3 + index * 0.25,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      floatingTweens.push(tween);
    });

    // =====================================
    // DATA NODES
    // =====================================

    dataNodes.forEach((node, index) => {
      floatingTweens.push(
        gsap.to(node.position, {
          y: node.position.y + (index % 2 === 0 ? 0.2 : -0.2),
          duration: 2 + (index % 4) * 0.3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
      );

      floatingTweens.push(
        gsap.to(node.scale, {
          x: 1.4,
          y: 1.4,
          z: 1.4,
          duration: 1.5 + (index % 3) * 0.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
      );
    });

    // =====================================
    // RENDER LOOP
    // =====================================

    let animationFrame = 0;

    const render = () => {
      animationFrame = requestAnimationFrame(render);
      update();
    };

    render();

    window.addEventListener("resize", resize);

    // Wait for layout and refresh scroll calculations.
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    // =====================================
    // CLEANUP
    // =====================================

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);

      roomTimeline.scrollTrigger?.kill();
      digitalTimeline.scrollTrigger?.kill();

      roomTimeline.kill();
      digitalTimeline.kill();

      floatingTweens.forEach((tween) => tween.kill());

      ScrollTrigger.refresh();
      dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="beyond-screen-background"
      aria-hidden="true"
    />
  );
}

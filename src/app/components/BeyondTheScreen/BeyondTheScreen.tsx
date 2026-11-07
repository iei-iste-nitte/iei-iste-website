
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createScene,
  DEPTH_MAIN_MAX,
  DEPTH_PRE_MAX,
} from "./scene";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const SCENES = [
  "SCENE 01 — THE DOOR",
  "SCENE 02 — THE ROOM",
  "SCENE 03 — THE SCREEN",
  "SCENE 04 — THE DEEP",
  "SCENE 05 — THE GATE",
];

export default function BeyondTheScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevent duplicate canvases during development / remounts.
    container.querySelectorAll("canvas").forEach((canvas) => {
      canvas.remove();
    });

    let world: ReturnType<typeof createScene>;

    try {
      world = createScene(container);
    } catch (error) {
      console.warn("BeyondTheScreen: WebGL unavailable", error);
      return;
    }

    container.appendChild(world.domElement);

    const roomEl = document.getElementById("journey-room");
    const digitalEl = document.getElementById("journey-digital");
    const aboutEl = document.getElementById("about");
    const home = document.getElementById("home");

    const hud = hudRef.current;

    const sceneEl =
      hud?.querySelector<HTMLElement>("[data-hud-scene]");

    const timeEl =
      hud?.querySelector<HTMLElement>("[data-hud-time]");

    const depthEl =
      hud?.querySelector<HTMLElement>("[data-hud-depth]");

    const { state } = world;

    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    // -----------------------------------------
    // SCROLL ANIMATION TIMELINES
    // -----------------------------------------

    const buildTimelines = (reduce: boolean) =>
      gsap.context(() => {
        const scrub: boolean | number = reduce ? true : 0.8;

        // SCENE 01–02: Door opening and room journey.
        const roomTl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: roomEl ?? document.documentElement,
            start: "top top",
            end: roomEl ? "bottom top" : "bottom bottom",
            scrub,
            invalidateOnRefresh: true,
          },
        });

        roomTl
          .fromTo(
            state,
            { door: 0 },
            {
              door: 1,
              duration: 1.8,
              ease: "power2.inOut",
              immediateRender: false,
            },
            0
          )
          .fromTo(
            state,
            { walk: 0 },
            {
              walk: 1,
              duration: 4.2,
              ease: "power1.inOut",
              immediateRender: false,
            },
            1.6
          );

        // SCENE 03–05: Screen transition and digital world.
        if (digitalEl) {
          const digitalTl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: digitalEl,
              start: "top top",
              end: "bottom bottom",
              scrub,
              invalidateOnRefresh: true,
            },
          });

          digitalTl
            .fromTo(
              state,
              { approach: 0 },
              {
                approach: 1,
                duration: 1.6,
                ease: "power2.inOut",
                immediateRender: false,
              },
              0
            )
            .fromTo(
              state,
              { mix: 0 },
              {
                mix: 1,
                duration: 1,
                ease: "power1.inOut",
                immediateRender: false,
              },
              0.9
            )
            .fromTo(
              state,
              { depthPre: 0 },
              {
                depthPre: DEPTH_PRE_MAX,
                duration: 1.9,
                immediateRender: false,
              },
              0
            )
            .fromTo(
              state,
              { depthMain: 0 },
              {
                depthMain: DEPTH_MAIN_MAX,
                duration: 8.1,
                ease: "power1.inOut",
                immediateRender: false,
              },
              1.9
            );
        }

        // -----------------------------------------
        // HUD PROGRESS
        // -----------------------------------------

        if (home && hud) {
          const total = () =>
            Math.max(
              1,
              (home.offsetHeight || 1) - window.innerHeight
            );

          ScrollTrigger.create({
            trigger: home,
            start: "top top",
            end: "bottom bottom",

            onUpdate: (self) => {
              const progress = self.progress;

              const index = Math.min(
                SCENES.length - 1,
                Math.floor(progress * SCENES.length)
              );

              if (sceneEl) {
                sceneEl.textContent = SCENES[index];
              }

              const seconds = Math.round(
                (progress * total()) / 60
              );

              const mm = String(
                Math.floor(seconds / 60)
              ).padStart(2, "0");

              const ss = String(
                seconds % 60
              ).padStart(2, "0");

              if (timeEl) {
                timeEl.textContent = `${mm}:${ss}`;
              }

              if (depthEl) {
                depthEl.textContent =
                  `${String(
                    Math.round(
                      state.depthMain + state.depthPre
                    )
                  ).padStart(3, "0")} m`;
              }
            },
          });
        }

        // -----------------------------------------
        // HIDE HUD AFTER INTRO
        // -----------------------------------------
        // IMPORTANT:
        // We only hide the HUD here.
        // We DO NOT pause or hide the Three.js background.
        // The digital world continues rendering behind
        // the rest of the website.

        if (aboutEl) {
          ScrollTrigger.create({
            trigger: aboutEl,
            start: "top 80%",
            onToggle: (self) => {
              hud?.classList.toggle(
                "is-hidden",
                self.progress > 0
              );
            },
          });
        }
      }, container);

    // -----------------------------------------
    // REDUCED MOTION
    // -----------------------------------------

    world.setReducedMotion(motionQuery.matches);

    let ctx = buildTimelines(motionQuery.matches);

    const onMotionChange = (
      event: MediaQueryListEvent
    ) => {
      world.setReducedMotion(event.matches);

      ctx.revert();
      ctx = buildTimelines(event.matches);

      ScrollTrigger.refresh();
    };

    motionQuery.addEventListener(
      "change",
      onMotionChange
    );

    // -----------------------------------------
    // THREE.JS RENDER LOOP
    // -----------------------------------------

    // Keep rendering continuously.
    // Do not pause the world when the intro ends.

    const tick = (time: number) => {
      world.render(time);
    };

    gsap.ticker.add(tick);

    // -----------------------------------------
    // RESIZE HANDLING
    // -----------------------------------------

    let resizeFrame = 0;

    const onResize = () => {
      cancelAnimationFrame(resizeFrame);

      resizeFrame = requestAnimationFrame(() => {
        world.resize();
        ScrollTrigger.refresh();
      });
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const resizeObserver = new ResizeObserver(() => {
      world.resize();
    });

    resizeObserver.observe(container);

    // Refresh once page assets have loaded.
    const onLoad = () => {
      world.resize();
      ScrollTrigger.refresh();
    };

    window.addEventListener("load", onLoad);

    // -----------------------------------------
    // CLEANUP
    // -----------------------------------------

    return () => {
      cancelAnimationFrame(resizeFrame);

      gsap.ticker.remove(tick);

      motionQuery.removeEventListener(
        "change",
        onMotionChange
      );

      window.removeEventListener("resize", onResize);
      window.removeEventListener(
        "orientationchange",
        onResize
      );
      window.removeEventListener("load", onLoad);

      resizeObserver.disconnect();

      ctx.revert();

      world.dispose();

      container.querySelectorAll("canvas").forEach((canvas) => {
        canvas.remove();
      });
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="beyond-screen-background"
        aria-hidden="true"
      />

      <div
        ref={hudRef}
        className="hud"
        aria-hidden="true"
      >
        <span className="hud__rec">
          <i /> REC
        </span>

        <span data-hud-scene>
          {SCENES[0]}
        </span>

        <span data-hud-time>
          00:00
        </span>

        <span data-hud-depth>
          000 m
        </span>
      </div>

      <a className="hud__skip" href="#about">
        Skip intro ↓
      </a>
    </>
  );
}

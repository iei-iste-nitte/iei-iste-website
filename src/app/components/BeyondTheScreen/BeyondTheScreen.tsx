"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createScene, DEPTH_MAIN_MAX, DEPTH_PRE_MAX } from "./scene";

gsap.registerPlugin(ScrollTrigger);
// Mobile browsers resize the viewport as the address bar slides in/out; this
// stops that from re-measuring (and so jumping) the scrubbed timelines.
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Fixed full-screen WebGL layer driven by two ScrollTriggers:
 *
 *  1. ROOM   - top of page -> start of the runway (the website sections).
 *              Door swings open, camera walks in towards the laptop.
 *  2. DIGITAL - the runway (extra scroll after the footer).
 *              Camera docks on the screen, the terminal dissolves into the
 *              digital world, then the camera travels deep into it.
 *
 * Each timeline writes to its own fields on a shared state object; the render
 * loop reads that state, so nothing ever fights over the camera.
 *
 * Nothing here touches scrolling itself (no scroll locking, no
 * normalizeScroll, canvas is pointer-events: none), so native touch scrolling
 * is preserved.
 */
export default function BeyondTheScreen() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Strict Mode / HMR safety: never leave a stale canvas behind.
    container.querySelectorAll("canvas").forEach((c) => c.remove());

    let world: ReturnType<typeof createScene>;
    try {
      world = createScene(container);
    } catch (error) {
      console.warn("BeyondTheScreen: WebGL unavailable", error);
      container.dataset.fallback = "true";
      return;
    }
    container.appendChild(world.domElement);

    const runway = document.getElementById("beyond-scroll-runway");
    const { state } = world;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Timelines are rebuilt only when the motion preference flips; the scene
    // itself is never recreated.
    const buildTimelines = (reduce: boolean) =>
      gsap.context(() => {
        // `true` = tie directly to scroll with no easing lag.
        const scrub: boolean | number = reduce ? true : 0.8;

        // Phase 1-4: door, walk in, approach the laptop (website content scroll)
        const roomTl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            endTrigger: runway ?? document.body,
            end: runway ? "top bottom" : "bottom bottom",
            scrub,
            invalidateOnRefresh: true,
          },
        });
        roomTl
          .fromTo(state, { door: 0 }, { door: 1, duration: 1.8, ease: "power2.inOut", immediateRender: false }, 0)
          .fromTo(state, { walk: 0 }, { walk: 1, duration: 4.2, ease: "power1.inOut", immediateRender: false }, 1.6);

        // Phase 5-6: enter the screen and travel through the digital world
        if (runway) {
          const digitalTl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: runway,
              start: "top bottom",
              end: "bottom bottom",
              scrub,
              invalidateOnRefresh: true,
            },
          });
          digitalTl
            .fromTo(state, { approach: 0 }, { approach: 1, duration: 1.6, ease: "power2.inOut", immediateRender: false }, 0)
            .fromTo(state, { mix: 0 }, { mix: 1, duration: 1.0, ease: "power1.inOut", immediateRender: false }, 0.9)
            .fromTo(state, { depthPre: 0 }, { depthPre: DEPTH_PRE_MAX, duration: 1.9, immediateRender: false }, 0)
            .fromTo(state, { depthMain: 0 }, { depthMain: DEPTH_MAIN_MAX, duration: 8.1, ease: "power1.inOut", immediateRender: false }, 1.9);
        }
      }, container);

    world.setReducedMotion(motionQuery.matches);
    let ctx = buildTimelines(motionQuery.matches);

    const onMotionChange = (event: MediaQueryListEvent) => {
      world.setReducedMotion(event.matches);
      ctx.revert();
      ctx = buildTimelines(event.matches);
      ScrollTrigger.refresh();
    };
    motionQuery.addEventListener("change", onMotionChange);

    // Single render loop, shared with GSAP's ticker (pauses with the tab).
    const tick = (time: number) => world.render(time);
    gsap.ticker.add(tick);

    // Resize handling: coalesced into one call per frame, idempotent, and it
    // never rebuilds the scene (see scene.resize / applyQuality).
    let resizeRaf = 0;
    const scheduleResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => world.resize());
    };
    window.addEventListener("resize", scheduleResize);

    // iOS/Android report the new size a beat after `orientationchange`.
    let orientationTimer = 0;
    const onOrientation = () => {
      scheduleResize();
      window.clearTimeout(orientationTimer);
      orientationTimer = window.setTimeout(() => {
        world.resize();
        ScrollTrigger.refresh();
      }, 300);
    };
    window.addEventListener("orientationchange", onOrientation);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleResize)
        : null;
    observer?.observe(container);

    const refresh = () => ScrollTrigger.refresh();
    const raf = requestAnimationFrame(refresh);
    if (document.readyState !== "complete") {
      window.addEventListener("load", refresh, { once: true });
    }
    document.fonts?.ready.then(refresh).catch(() => undefined);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.clearTimeout(orientationTimer);
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", onOrientation);
      motionQuery.removeEventListener("change", onMotionChange);
      observer?.disconnect();
      gsap.ticker.remove(tick);
      ctx.revert();
      world.dispose();
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

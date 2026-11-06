
"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS, SITE } from "../data/site";

const IDS = NAV_LINKS.map((l) => l.href.slice(1));

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const targets = IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    targets.forEach((t) => io.observe(t));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("nav-open");

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("nav-open");
    };
  }, [open]);

  return (
    <header className={`nav${solid ? " is-solid" : ""}${open ? " is-open" : ""}`}>
      <div className="nav__bar">
        <a href="#home" className="wordmark" aria-label="IEI × ISTE NITTE — home">
          <span>IEI</span>
          <i>×</i>
          <span>ISTE</span>
          <small>{SITE.campus}</small>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={active === l.href.slice(1) ? "true" : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a href="#events" className="nav__cta">
          Explore events <span aria-hidden>↗</span>
        </a>

        <button
          type="button"
          className="burger"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <div id="mobile-menu" className="menu" hidden={!open}>
        <nav aria-label="Mobile">
          {NAV_LINKS.map((l, i) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              <em>{String(i).padStart(2, "0")}</em>
              {l.label}
            </a>
          ))}
        </nav>
        <p>{SITE.institute}</p>
      </div>
    </header>
  );
}


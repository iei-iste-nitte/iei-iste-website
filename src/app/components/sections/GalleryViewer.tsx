"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Frame from "../ui/Frame";

interface GalleryItem {
  id: string;
  caption: string;
  tag: string;
  image?: string;
  alt: string;
}

const RATIOS = ["16 / 10", "3 / 4", "3 / 4", "16 / 10", "21 / 9", "3 / 4"];

export default function GalleryViewer({ items }: { items: GalleryItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const withImages = items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => Boolean(item.image));

  const open = useCallback((i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null || withImages.length === 0) return;
      const pos = withImages.findIndex(({ i }) => i === index);
      const next = withImages[(pos + dir + withImages.length) % withImages.length];
      setIndex(next.i);
    },
    [index, withImages]
  );

  useEffect(() => {
    if (index === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  const current = index !== null ? items[index] : null;

  return (
    <>
      <div className="gallery">
        {items.map((item, i) => {
          const frame = (
            <Frame
              src={item.image}
              alt={item.alt}
              ratio={RATIOS[i % RATIOS.length]}
              label={`FRAME ${String(i + 1).padStart(2, "0")}`}
              sizes="(max-width: 900px) 82vw, 56vw"
            />
          );

          return (
            <figure className={`shot shot--${i + 1}`} key={item.id} data-reveal>
              {item.image ? (
                <button
                  type="button"
                  className="shot__open"
                  onClick={() => open(i)}
                  aria-label={`Open photograph: ${item.caption}`}
                >
                  {frame}
                </button>
              ) : (
                frame
              )}

              <figcaption>
                <span>FIG. {String(i + 1).padStart(2, "0")}</span>
                <strong>{item.caption}</strong>
                <span>{item.tag}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        className="lightbox"
        onClose={() => setIndex(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        {current?.image && (
          <div className="lightbox__inner">
            <div className="lightbox__stage">
              <Image src={current.image} alt={current.alt} fill sizes="100vw" />
            </div>

            <div className="lightbox__bar">
              <span>{current.caption} — {current.tag}</span>

              <span className="lightbox__ctrl">
                <button type="button" onClick={() => step(-1)} aria-label="Previous photograph">
                  ←
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next photograph">
                  →
                </button>
                <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close">
                  Close
                </button>
              </span>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
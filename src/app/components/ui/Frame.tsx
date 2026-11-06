import Image from "next/image";

interface FrameProps {
  src?: string;
  alt: string;
  /** CSS aspect-ratio value, e.g. "16 / 10". */
  ratio: string;
  /** Shown inside the placeholder, e.g. "PORTRAIT". */
  label?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export default function Frame({
  src,
  alt,
  ratio,
  label = "PHOTOGRAPH",
  sizes = "(max-width: 900px) 100vw, 60vw",
  priority,
  className = "",
}: FrameProps) {
  return (
    <div
      className={`frame ${src ? "frame--filled" : "frame--empty"} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="frame__img"
        />
      ) : (
        <>
          <span className="frame__tick frame__tick--tl" aria-hidden />
          <span className="frame__tick frame__tick--tr" aria-hidden />
          <span className="frame__tick frame__tick--bl" aria-hidden />
          <span className="frame__tick frame__tick--br" aria-hidden />
          <span className="frame__label">
            {label}
            <small>{ratio.replace(/\s/g, "")} · placeholder</small>
          </span>
        </>
      )}
    </div>
  );
}
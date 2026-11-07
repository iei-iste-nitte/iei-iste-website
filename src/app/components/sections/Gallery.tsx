
import SectionHead from "../ui/SectionHead";
import GalleryViewer from "./GalleryViewer";
import { GALLERY } from "../../data/site";

export default function Gallery() {
  return (
    <section
      className="section gallery-section"
      id="gallery"
      aria-labelledby="gallery-title"
    >
      <div className="wrap">
        <SectionHead
          index="04"
          label="IN FRAMES"
          meta={`${String(GALLERY.length).padStart(2, "0")} FRAMES`}
        />

        <h2 className="display gallery__title" id="gallery-title" data-reveal>
          <span className="line">The community,</span>
          <span className="line line--dim">
            <em>in frames.</em>
          </span>
        </h2>
      </div>

      <div className="wrap wrap--wide">
        <GalleryViewer items={GALLERY} />
      </div>
    </section>
  );
}


import { SITE } from "../data/site";

function Beat({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`beat ${className}`}>{children}</div>;
}

export default function Opening() {
  return (
    <div id="home" className="opening">
      <div id="journey-room" className="journey journey--room">
        <Beat className="beat--hero">
          <p className="eyebrow">{SITE.institute.toUpperCase()}</p>

          <h1 className="hero__title">
            <span>THINK.</span>
            <span>CREATE.</span>
            <span className="hero__accent">INNOVATE.</span>
          </h1>

          <p className="hero__desc">
            A community of engineers, innovators and creators. Exploring
            technology, sharing ideas and building what comes next.
          </p>

          <div className="hero__actions">
            <a className="btn btn--solid" href="#events">
              Explore events <span aria-hidden>↗</span>
            </a>
            <a className="btn btn--line" href="#about">
              About us
            </a>
          </div>

          <span className="hero__scroll">
            SCROLL TO EXPLORE <i aria-hidden />
          </span>

          <span className="hero__side" aria-hidden>
            ENGINEERING THE FUTURE
          </span>
        </Beat>

        <Beat className="beat--cap">
          <p className="cap">Every build begins behind a door.</p>
        </Beat>

        <Beat className="beat--cap beat--right">
          <p className="cap">Someone is already inside, working.</p>
        </Beat>

        <Beat className="beat--cap">
          <p className="cap">Come closer.</p>
        </Beat>
      </div>

      <div id="journey-digital" className="journey journey--digital">
        <Beat className="beat--cap">
          <p className="cap">The screen is a doorway too.</p>
        </Beat>

        <Beat className="beat--cap beat--right">
          <p className="cap">Beyond it, a world made of ideas.</p>
        </Beat>

        <Beat className="beat--cap">
          <p className="cap">Signal, structure, systems.</p>
        </Beat>

        <Beat className="beat--cap beat--right">
          <p className="cap">Keep going.</p>
        </Beat>

        <Beat className="beat--gate">
          <p className="eyebrow">IEI × ISTE · NITTE</p>
          <a className="gate__link" href="#about">
            Enter the community <span aria-hidden>↓</span>
          </a>
        </Beat>
      </div>
    </div>
  );
}

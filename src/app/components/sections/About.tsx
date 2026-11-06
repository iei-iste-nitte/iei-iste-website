
import SectionHead from "../ui/SectionHead";
import { PILLARS, SITE } from "../../data/site";

export default function About() {
  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="wrap">
        <SectionHead index="01" label="WHO WE ARE" meta="IEI × ISTE / NITTE" />

        <h2 className="display about__title" id="about-title" data-reveal>
          <span className="line">More than a club.</span>
          <span className="line line--dim">
            <em>A community of builders.</em>
          </span>
        </h2>

        <div className="about__body">
          <dl className="about__meta" data-reveal>
            <div>
              <dt>Status</dt>
              <dd>
                <i className="pulse" aria-hidden /> Online
              </dd>
            </div>
            <div>
              <dt>Base</dt>
              <dd>{SITE.institute}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>Student technical community</dd>
            </div>
          </dl>

          <p className="about__lead" data-reveal>
            IEI × ISTE NITTE brings together students who are passionate about
            engineering, technology and innovation.
          </p>

          <p className="about__desc" data-reveal>
            From technical workshops and competitions to collaborative projects
            and knowledge-sharing sessions, we create opportunities to learn,
            experiment and grow together.
          </p>
        </div>

        <ol className="pillars">
          {PILLARS.map((pillar) => (
            <li className="pillar" key={pillar.title} data-reveal>
              <span className="pillar__n">{pillar.numeral}</span>
              <h3 className="pillar__t">{pillar.title}</h3>
              <p className="pillar__d">{pillar.description}</p>
              <span className="pillar__arrow" aria-hidden>
                ↗
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}


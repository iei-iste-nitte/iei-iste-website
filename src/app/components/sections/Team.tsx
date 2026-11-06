import SectionHead from "../ui/SectionHead";
import TeamDirectory from "./TeamDirectory";
import { TEAM } from "../../data/site";

export default function Team() {
  return (
    <section className="section team" id="team" aria-labelledby="team-title">
      <div className="wrap">
        <SectionHead index="03" label="THE PEOPLE BEHIND IT" meta="CORE TEAM" />

        <div className="team__intro">
          <h2 className="display team__title" id="team-title" data-reveal>
            <span className="line">Great ideas.</span>
            <span className="line line--dim">
              <em>Better together.</em>
            </span>
          </h2>

          <div className="team__aside" data-reveal>
            <p>
              Meet the people who make our community happen. A team of students
              working together to create, organize and inspire.
            </p>
            <a href="#contact" className="btn btn--solid">
              Meet the community <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        <div data-reveal>
          <TeamDirectory members={TEAM} />
        </div>

        <p className="team__note" data-reveal>
          CORE TEAM PHOTOGRAPHS &amp; PROFILES COMING SOON
        </p>
      </div>
    </section>
  );
}
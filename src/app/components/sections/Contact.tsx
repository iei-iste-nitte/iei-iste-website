
import SectionHead from "../ui/SectionHead";
import { SITE } from "../../data/site";

export default function Contact() {
  return (
    <section
      className="section contact"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="wrap">
        <SectionHead
          index="05"
          label="START A CONVERSATION"
          meta="WE'RE LISTENING"
        />

        <div className="contact__main">
          <h2 className="display contact__title" id="contact-title" data-reveal>
            <span className="line">Have an idea?</span>
            <span className="line line--dim">
              <em>Let&apos;s make it happen.</em>
            </span>
          </h2>

          <div className="contact__aside" data-reveal>
            <p>
              Interested in collaborating, joining our community, or learning
              more about what we do? We&apos;d love to hear from you.
            </p>

            <a
              className="contact__email"
              href={`mailto:${SITE.email}`}
            >
              {SITE.email}
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        <div className="contact__bottom" data-reveal>
          <span>IEI × ISTE NITTE</span>
          <span>ENGINEERING THE FUTURE, TOGETHER.</span>
        </div>
      </div>
    </section>
  );
}

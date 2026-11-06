import Frame from "../ui/Frame";
import SectionHead from "../ui/SectionHead";
import { EVENTS, SITE } from "../../data/site";

function registerHref(title: string) {
  const subject = encodeURIComponent(`Registration interest: ${title}`);
  return `mailto:${SITE.email}?subject=${subject}`;
}

export default function Events() {
  return (
    <section className="section events" id="events" aria-labelledby="events-title">
      <div className="wrap">
        <SectionHead index="02" label="WHAT WE DO" meta="LEARN · BUILD · COMPETE" />

        <div className="events__intro">
          <h2 className="display events__title" id="events-title" data-reveal>
            <span className="line">Experiences that</span>
            <span className="line line--dim">
              <em>move you forward.</em>
            </span>
          </h2>

          <div className="events__aside" data-reveal>
            <p>
              Discover opportunities to explore your interests and challenge
              yourself.
            </p>
            <a href="#contact" className="link-arrow">
              Get involved <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        <div className="event-list">
          {EVENTS.map((event, i) => (
            <article className={`event event--${i + 1}`} key={event.number}>
              <div className="event__media" data-reveal>
                <Frame
                  src={event.image}
                  alt={event.imageAlt}
                  ratio={i === 2 ? "21 / 9" : i === 1 ? "4 / 5" : "16 / 11"}
                  label={`EVENT ${event.number}`}
                  sizes="(max-width: 900px) 100vw, 62vw"
                />
              </div>

              <div className="event__body" data-reveal>
                <span className="event__num" aria-hidden>
                  {event.number}
                </span>
                <p className="event__cat">{event.category}</p>
                <h3 className="event__title">{event.title}</h3>
                <p className="event__desc">{event.description}</p>

                <dl className="event__meta">
                  <div>
                    <dt>Status</dt>
                    <dd>{event.status}</dd>
                  </div>
                </dl>

                <a className="btn btn--line" href={registerHref(event.title)}>
                  Register interest <span aria-hidden>↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="events__note" data-reveal>
          EVENT LISTINGS AND REGISTRATIONS WILL BE AVAILABLE HERE.
        </p>
      </div>
    </section>
  );
}
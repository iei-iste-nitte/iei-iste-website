
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Cpu,
  Lightbulb,
  Rocket,
  Users,
} from "lucide-react";

const highlights = [
  {
    icon: Code2,
    title: "Technical Excellence",
    description:
      "Learn, experiment and develop skills beyond the classroom.",
  },
  {
    icon: Lightbulb,
    title: "Innovation & Ideas",
    description:
      "Turn creative ideas into meaningful projects and solutions.",
  },
  {
    icon: Users,
    title: "Community & Collaboration",
    description:
      "Connect with curious minds and build something together.",
  },
];

const events = [
  {
    number: "01",
    category: "WORKSHOP",
    title: "Technical Workshops",
    description: "Hands-on learning through practical technical sessions.",
    color: "blue",
  },
  {
    number: "02",
    category: "COMPETITION",
    title: "Hackathons & Challenges",
    description: "Build, compete and bring innovative ideas to life.",
    color: "purple",
  },
  {
    number: "03",
    category: "COMMUNITY",
    title: "Talks & Seminars",
    description: "Learn from experts, innovators and fellow students.",
    color: "cyan",
  },
];

export default function Home() {
  return (
    <main>
      {/* NAVIGATION */}
      <header className="navbar">
        <a href="#" className="brand">
          <span className="brand-mark">IEI</span>
          <span className="brand-cross">×</span>
          <span className="brand-mark">ISTE</span>
          <span className="brand-divider" />
          <span className="brand-campus">NITTE</span>
        </a>

        <nav className="nav-links">
          <a href="#home" className="active">Home</a>
          <a href="#about">About</a>
          <a href="#events">Events</a>
          <a href="#team">Our Team</a>
          <a href="#contact">Contact</a>
        </nav>

        <a href="#events" className="nav-cta">
          Explore events <ArrowUpRight size={15} />
        </a>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="live-dot" />
            NITTE STUDENT TECHNICAL COMMUNITY
          </div>

          <h1>
            THINK.
            <br />
            <span className="gradient-text">CREATE.</span>
            <br />
            <span className="outline-text">INNOVATE.</span>
          </h1>

          <p className="hero-description">
            A community of engineers, innovators and creators.
            Exploring technology, sharing ideas and building
            what comes next.
          </p>

          <div className="hero-actions">
            <a href="#events" className="button-primary">
              Explore our events <ArrowUpRight size={18} />
            </a>
            <a href="#about" className="button-secondary">
              Discover our community <ArrowRight size={17} />
            </a>
          </div>

          <div className="hero-bottom">
            <div className="scroll-indicator">
              <ArrowDown size={15} />
              <span>SCROLL TO EXPLORE</span>
            </div>
            <span className="hero-location">
              NMAM INSTITUTE OF TECHNOLOGY · NITTE
            </span>
          </div>
        </div>

        <div className="hero-side-label">ENGINEERING THE FUTURE</div>
      </section>

      {/* ABOUT */}
      <section className="section about-section" id="about">
        <div className="section-heading">
          <span className="section-label">01 / WHO WE ARE</span>
          <h2>
            More than a club.
            <br />
            <span className="gradient-text">A community of builders.</span>
          </h2>
        </div>

        <div className="about-content">
          <p className="about-lead">
            IEI × ISTE NITTE brings together students who
            are passionate about engineering, technology
            and innovation.
          </p>
          <p className="about-description">
            From technical workshops and competitions to
            collaborative projects and knowledge-sharing
            sessions, we create opportunities to learn,
            experiment and grow together.
          </p>
        </div>

        <div className="highlight-grid">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <article className="highlight-card" key={item.title}>
                <div className="highlight-icon">
                  <Icon size={23} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <ArrowUpRight className="card-arrow" size={19} />
              </article>
            );
          })}
        </div>
      </section>

      {/* EVENTS */}
      <section className="section events-section" id="events">
        <div className="section-topline">
          <span className="section-label">02 / WHAT WE DO</span>
          <span className="section-label">LEARN · BUILD · COMPETE</span>
        </div>

        <div className="events-heading">
          <div>
            <h2>
              Experiences that
              <br />
              <span className="gradient-text">move you forward.</span>
            </h2>
            <p>
              Discover opportunities to explore your interests
              and challenge yourself.
            </p>
          </div>

          <a href="#contact" className="text-link">
            Get involved <ArrowUpRight size={17} />
          </a>
        </div>

        <div className="event-grid">
          {events.map((event) => (
            <article
              className={`event-card ${event.color}`}
              key={event.number}
            >
              <div className="event-card-top">
                <span>{event.category}</span>
                <span>{event.number}</span>
              </div>

              <div className="event-art">
                {event.number === "01" && <Code2 size={62} />}
                {event.number === "02" && <Rocket size={62} />}
                {event.number === "03" && <Lightbulb size={62} />}
              </div>

              <div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>

              <ArrowUpRight className="event-arrow" size={21} />
            </article>
          ))}
        </div>

        <p className="events-note">
          EVENT LISTINGS AND REGISTRATIONS WILL BE AVAILABLE HERE.
        </p>
      </section>

      {/* COMMUNITY */}
      <section className="community-section" id="team">
        <div className="community-glow" />
        <div className="community-content">
          <span className="section-label">03 / THE PEOPLE BEHIND IT</span>
          <div className="community-icon">
            <Cpu size={34} />
          </div>
          <h2>
            Great ideas.
            <br />
            <span className="gradient-text">Better together.</span>
          </h2>
          <p>
            Meet the people who make our community happen.
            A team of students working together to create,
            organize and inspire.
          </p>
          <a href="#contact" className="button-primary">
            Meet the community <ArrowUpRight size={18} />
          </a>
          <div className="team-placeholder">
            CORE TEAM PHOTOGRAPHS & PROFILES COMING SOON
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="section contact-section" id="contact">
        <span className="section-label">04 / GET CONNECTED</span>
        <h2>
          Your next idea
          <br />
          <span className="gradient-text">starts here.</span>
        </h2>
        <p>
          Interested in technology, innovation and being
          part of something bigger? Stay connected with us.
        </p>
        <a href="mailto:contact@iei-iste-nitte.example" className="button-primary">
          Get in touch <ArrowUpRight size={18} />
        </a>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <a href="#home" className="brand footer-brand">
          <span className="brand-mark">IEI</span>
          <span className="brand-cross">×</span>
          <span className="brand-mark">ISTE</span>
        </a>

        <p>Engineering minds. Connecting ideas. Building tomorrow.</p>

        <span className="footer-copy">
          © 2026 IEI × ISTE NITTE. All rights reserved.
        </span>
      </footer>
      <section
  id="beyond-scroll-runway"
  className="beyond-scroll-runway"
  aria-label="Enter the digital world"
/>
    </main>
  );
}
<section
  id="beyond-scroll-runway"
  className="beyond-scroll-runway"
  aria-label="Enter the digital environment"
/>
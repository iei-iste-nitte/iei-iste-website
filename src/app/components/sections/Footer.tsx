
import { NAV_LINKS, SITE } from "../../data/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div className="footer__brand">
            <a
              href="#home"
              className="wordmark"
              aria-label="IEI × ISTE — back to start"
            >
              <span>IEI</span>
              <i>×</i>
              <span>ISTE</span>
            </a>
            <p>{SITE.tagline}</p>
          </div>

          <nav className="footer__nav" aria-label="Footer">
            {NAV_LINKS.filter((l) => l.href !== "#home").map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="footer__where">
            <span>{SITE.institute}</span>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </div>
        </div>

        <div className="footer__bar">
          <span>
            © {SITE.year} IEI × ISTE NITTE. All rights reserved.
          </span>
          <span className="footer__end">
  {"//"} end of transmission
</span>
          <a href="#home">Back to start ↑</a>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useState } from "react";
import Frame from "../ui/Frame";
import type { TeamMember } from "../../data/site";

export default function TeamDirectory({ members }: { members: TeamMember[] }) {
  const [active, setActive] = useState(0);
  const current = members[active];

  return (
    <div className="directory">
      <ul className="directory__list">
        {members.map((member, i) => {
          const name = member.name ?? "Name to be announced";

          return (
            <li key={member.id}>
              <button
                type="button"
                className={`member${i === active ? " is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-current={i === active}
              >
                <span className="member__idx">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="member__main">
                  <span className={`member__name${member.name ? "" : " is-placeholder"}`}>
                    {name}
                  </span>
                  <span className="member__role">{member.role}</span>
                </span>

                <span className="member__society">{member.society}</span>

                <span className="member__thumb" aria-hidden>
                  <Frame src={member.image} alt="" ratio="4 / 5" label="" sizes="96px" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <aside className="directory__preview" aria-live="polite">
        <Frame
          key={current.id}
          src={current.image}
          alt={current.name ? `Portrait of ${current.name}` : `${current.role} portrait`}
          ratio="4 / 5"
          label="PORTRAIT"
          sizes="(max-width: 900px) 0px, 36vw"
          className="directory__frame"
        />

        <div className="directory__caption">
          <span>
            {String(active + 1).padStart(2, "0")} / {String(members.length).padStart(2, "0")}
          </span>
          <strong>{current.role}</strong>
          <span>{current.society === "Joint" ? "IEI × ISTE" : current.society}</span>
        </div>

        <p className="directory__bio">
          {current.bio ?? "Profile coming soon."}
        </p>
      </aside>
    </div>
  );
}
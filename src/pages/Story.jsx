import { useEffect, useState } from "react";
import { STATUS_META } from "../lib/content";
import { STORY } from "../lib/fund";

const ARRIVALS = ["left", "right", "bottom", "top"];

function PointingGirl() {
  return (
    <svg className="teacher" viewBox="0 0 240 340" aria-hidden="true">
      <ellipse cx="120" cy="318" rx="62" ry="9" fill="#f3c2d4" />
      <path d="M86 118c-18 36-22 92-8 150h22c-8-48-4-96 10-132z" fill="#3a241c" />
      <path d="M156 112c22 28 30 86 16 162h-24c8-58 4-110-8-146z" fill="#3a241c" />
      <path d="M148 84c34-6 48 28 40 62 8 22-2 40-16 46-6-28-8-52-22-70 2-16 0-30-2-38z" fill="#3a241c" />
      <path d="M108 148h28c2 10 2 16 0 24h-28c-2-8-2-14 0-24z" fill="#f6d3c4" />
      <path d="M78 176c-6 28-14 78-18 122h124c-4-44-12-94-18-122-16 16-72 16-88 0z" fill="#e56b93" stroke="#2c1520" strokeWidth="3" strokeLinejoin="round" />
      <g className="teacher-book">
        <path d="M78 186c-22 10-36 28-42 48" fill="none" stroke="#f6d3c4" strokeWidth="14" strokeLinecap="round" />
        <path d="M78 186c-22 10-36 28-42 48" fill="none" stroke="#2c1520" strokeWidth="3" strokeLinecap="round" />
        <path d="M8 214c16-12 30-12 46 0v38c-16-12-30-12-46 0z" fill="#fff" stroke="#2c1520" strokeWidth="3" strokeLinejoin="round" />
        <path d="M31 216v36" stroke="#2c1520" strokeWidth="2" />
        <path d="M16 228h10M16 236h10" stroke="#e56b93" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="teacher-arm">
        <path d="M162 180c24-8 44-28 58-54" fill="none" stroke="#f6d3c4" strokeWidth="14" strokeLinecap="round" />
        <path d="M162 180c24-8 44-28 58-54" fill="none" stroke="#2c1520" strokeWidth="3" strokeLinecap="round" />
        <path d="M210 112l32-16-8 26z" fill="#d45378" stroke="#2c1520" strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <circle cx="122" cy="108" r="40" fill="#f6d3c4" stroke="#2c1520" strokeWidth="3" />
      <path d="M84 112c2-40 26-62 46-58 18 2 36 18 40 46-12-22-28-32-44-30-16 0-32 10-42 42z" fill="#3a241c" />
      <path d="M86 118c-6 16-4 34 8 44 2-16 6-30 16-40-8-6-16-6-24-4z" fill="#3a241c" />
      <path d="M158 116c8 8 12 22 10 38-12-8-16-24-14-36 4-2 4-2 4-2z" fill="#3a241c" />
      <path d="M146 78c12-18 32-18 40-2-12 2-18 10-18 18-8-4-16-10-22-16z" fill="#d45378" stroke="#2c1520" strokeWidth="2" strokeLinejoin="round" />
      <path d="M168 78c16 4 22 18 12 30-8-8-14-16-12-24 2-4 0-6 0-6z" fill="#f4a0b8" stroke="#2c1520" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="164" cy="82" r="4.5" fill="#fff" stroke="#2c1520" strokeWidth="1.6" />
      <path d="M98 104c6-7 14-7 20 0" fill="none" stroke="#2c1520" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M132 104c6-7 14-7 20 0" fill="none" stroke="#2c1520" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M100 112l-5-5M108 108v-6M116 112l5-5" fill="none" stroke="#2c1520" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M134 112l-5-5M142 108v-6M150 112l5-5" fill="none" stroke="#2c1520" strokeWidth="1.7" strokeLinecap="round" />
      <ellipse className="teacher-eye" cx="108" cy="116" rx="3.4" ry="3.8" fill="#2c1520" />
      <ellipse className="teacher-eye" cx="142" cy="116" rx="3.4" ry="3.8" fill="#2c1520" />
      <path d="M112 132c8 8 16 8 24 0" fill="none" stroke="#2c1520" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="92" cy="128" rx="7" ry="4" fill="#f3a3b8" />
      <ellipse cx="154" cy="128" rx="7" ry="4" fill="#f3a3b8" />
    </svg>
  );
}

function DoorGirl() {
  return (
    <svg className="teacher" viewBox="0 0 250 340" aria-hidden="true">
      <ellipse cx="146" cy="318" rx="54" ry="9" fill="#f3c2d4" />
      <g className="motion-door">
        <path d="M6 146h86v170H6z" fill="#fffdfb" stroke="#2c1520" strokeWidth="3" />
        <path d="M18 162h34v40H18z" fill="#f7d0de" stroke="#2c1520" strokeWidth="2.5" />
        <circle cx="76" cy="236" r="5.5" fill="#d45378" stroke="#2c1520" strokeWidth="2" />
      </g>
      <circle cx="158" cy="86" r="52" fill="#1c120e" />
      <path d="M118 178c-2 34-8 86-8 126h96c0-40-6-92-8-126-16 16-64 16-80 0z" fill="#7a2344" stroke="#2c1520" strokeWidth="3" strokeLinejoin="round" />
      <path d="M142 186h32l-6 22h-20z" fill="#fff6f4" stroke="#2c1520" strokeWidth="2" />
      <path d="M124 190c-16 16-34 28-52 36" fill="none" stroke="#8d5524" strokeWidth="14" strokeLinecap="round" />
      <path d="M124 190c-16 16-34 28-52 36" fill="none" stroke="#2c1520" strokeWidth="3" strokeLinecap="round" />
      <g className="motion-wave">
        <path d="M186 188c26-16 46-48 36-92" fill="none" stroke="#8d5524" strokeWidth="13" strokeLinecap="round" />
        <path d="M186 188c26-16 46-48 36-92" fill="none" stroke="#2c1520" strokeWidth="3" strokeLinecap="round" />
        <path d="M210 92c8-16 24-14 28 2 2 10-6 18-16 16-8-1-12-8-12-18z" fill="#8d5524" stroke="#2c1520" strokeWidth="3" />
        <path d="M214 78l-2-12M224 74l1-13M234 80l6-10" fill="none" stroke="#2c1520" strokeWidth="2.3" strokeLinecap="round" />
      </g>
      <path d="M146 150h26v20h-26z" fill="#8d5524" />
      <circle cx="158" cy="112" r="36" fill="#8d5524" stroke="#2c1520" strokeWidth="3" />
      <path d="M176 58c16 2 26 8 28 16" fill="none" stroke="#e2b657" strokeWidth="5" strokeLinecap="round" />
      <path d="M134 104c6-6 14-6 18 0" fill="none" stroke="#2c1520" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M168 104c6-6 14-6 18 0" fill="none" stroke="#2c1520" strokeWidth="2.3" strokeLinecap="round" />
      <ellipse className="teacher-eye" cx="144" cy="114" rx="3.3" ry="3.6" fill="#2c1520" />
      <ellipse className="teacher-eye" cx="176" cy="114" rx="3.3" ry="3.6" fill="#2c1520" />
      <path d="M146 132c8 10 18 10 26 0" fill="none" stroke="#2c1520" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="128" cy="126" rx="6" ry="3.4" fill="#c47a5a" />
      <ellipse cx="190" cy="126" rx="6" ry="3.4" fill="#c47a5a" />
    </svg>
  );
}

function ClipboardGirl() {
  return (
    <svg className="teacher" viewBox="0 0 240 340" aria-hidden="true">
      <ellipse cx="120" cy="318" rx="60" ry="9" fill="#f3c2d4" />
      <path d="M86 128c-14 46-8 110 2 168" fill="none" stroke="#24160f" strokeWidth="18" strokeLinecap="round" />
      <path d="M154 128c14 46 8 110-2 168" fill="none" stroke="#24160f" strokeWidth="18" strokeLinecap="round" />
      <circle cx="88" cy="300" r="8" fill="#e56b93" stroke="#2c1520" strokeWidth="2" />
      <circle cx="152" cy="300" r="8" fill="#e56b93" stroke="#2c1520" strokeWidth="2" />
      <path d="M74 214c-6 28-12 66-12 96h116c0-30-6-68-12-96-18 14-74 14-92 0z" fill="#e56b93" stroke="#2c1520" strokeWidth="3" />
      <path d="M86 164h68c8 18 6 40-4 54H90c-10-14-12-36-4-54z" fill="#fff" stroke="#2c1520" strokeWidth="3" />
      <rect x="70" y="196" width="108" height="118" rx="10" fill="#fff" stroke="#2c1520" strokeWidth="3" />
      <rect x="104" y="186" width="36" height="16" rx="4" fill="#d9d3cf" stroke="#2c1520" strokeWidth="2.4" />
      <path d="M86 222h46M86 240h46M86 258h34" stroke="#e7b7c6" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="140" y="248" width="20" height="20" rx="3" fill="#fff" stroke="#2c1520" strokeWidth="2.4" />
      <path d="M144 258l5 5 9-11" fill="none" stroke="#9d2348" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <g className="motion-tick">
        <path d="M168 168c22 18 34 40 28 70" fill="none" stroke="#c47a4a" strokeWidth="13" strokeLinecap="round" />
        <path d="M168 168c22 18 34 40 28 70" fill="none" stroke="#2c1520" strokeWidth="3" strokeLinecap="round" />
        <path d="M186 232l16 22" stroke="#9d2348" strokeWidth="6" strokeLinecap="round" />
        <path d="M198 250l10 10" stroke="#2c1520" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="120" cy="108" r="38" fill="#e0ac69" stroke="#2c1520" strokeWidth="3" />
      <path d="M82 114c4-48 30-70 48-66 20 4 36 26 36 56-12-26-26-36-42-34-16 0-32 14-42 44z" fill="#24160f" />
      <circle cx="104" cy="114" r="13" fill="none" stroke="#2c1520" strokeWidth="2.6" />
      <circle cx="138" cy="114" r="13" fill="none" stroke="#2c1520" strokeWidth="2.6" />
      <path d="M117 114h8" stroke="#2c1520" strokeWidth="2.6" />
      <ellipse className="teacher-eye" cx="104" cy="115" rx="2.7" ry="3.1" fill="#2c1520" />
      <ellipse className="teacher-eye" cx="138" cy="115" rx="2.7" ry="3.1" fill="#2c1520" />
      <path d="M106 132c8 8 20 8 28 0" fill="none" stroke="#2c1520" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="86" cy="126" rx="6" ry="3.2" fill="#e89a8c" />
      <ellipse cx="154" cy="126" rx="6" ry="3.2" fill="#e89a8c" />
    </svg>
  );
}

function WritingGirl() {
  return (
    <svg className="teacher" viewBox="0 0 240 340" aria-hidden="true">
      <ellipse cx="120" cy="318" rx="62" ry="9" fill="#f3c2d4" />
      <path d="M72 176c0 40-2 90 2 126h92c4-36 2-86 2-126-20 20-76 20-96 0z" fill="#4d2434" stroke="#2c1520" strokeWidth="3" strokeLinejoin="round" />
      <path d="M120 176l-26 52h26z" fill="#ffd0e0" />
      <path d="M120 176l26 52h-26z" fill="#fff" />
      <path d="M94 176h52" stroke="#2c1520" strokeWidth="3" strokeLinecap="round" />
      <g transform="rotate(-8 124 250)">
        <rect x="58" y="206" width="132" height="92" rx="8" fill="#fff" stroke="#2c1520" strokeWidth="3" />
        <path d="M74 228h78M74 246h78M74 264h48" stroke="#e7b7c6" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <g className="motion-write">
        <path d="M150 196c20 6 36 16 46 34" fill="none" stroke="#f0c2a0" strokeWidth="13" strokeLinecap="round" />
        <path d="M150 196c20 6 36 16 46 34" fill="none" stroke="#2c1520" strokeWidth="3" strokeLinecap="round" />
        <path d="M188 224l18 16" stroke="#2c1520" strokeWidth="4" strokeLinecap="round" />
        <path d="M184 218l22 6-4 10z" fill="#9d2348" stroke="#2c1520" strokeWidth="1.6" />
      </g>
      <path d="M70 150c6 24 16 36 28 40 2-20 0-34-8-48" fill="#1c1a22" />
      <path d="M170 150c-6 24-16 36-28 40-2-20 0-34 8-48" fill="#1c1a22" />
      <circle cx="120" cy="112" r="40" fill="#f0c2a0" stroke="#2c1520" strokeWidth="3" />
      <path d="M80 118c2-52 28-74 50-70 24 4 40 28 40 64-8-30-24-46-46-46-18 2-34 16-44 52z" fill="#1c1a22" />
      <path d="M96 96c10 8 28 8 40 0" fill="#1c1a22" />
      <circle cx="84" cy="132" r="6" fill="none" stroke="#d45378" strokeWidth="2.4" />
      <circle cx="156" cy="132" r="6" fill="none" stroke="#d45378" strokeWidth="2.4" />
      <path d="M98 108c6-6 12-6 16 0" fill="none" stroke="#2c1520" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M128 108c6-6 12-6 16 0" fill="none" stroke="#2c1520" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse className="teacher-eye" cx="106" cy="118" rx="3.2" ry="3.6" fill="#2c1520" />
      <ellipse className="teacher-eye" cx="136" cy="118" rx="3.2" ry="3.6" fill="#2c1520" />
      <path d="M108 134c8 7 16 7 24 0" fill="none" stroke="#2c1520" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="90" cy="128" rx="6" ry="3.2" fill="#f3a3b8" />
      <ellipse cx="150" cy="128" rx="6" ry="3.2" fill="#f3a3b8" />
    </svg>
  );
}

const GUIDES = [PointingGirl, DoorGirl, ClipboardGirl, WritingGirl];

function withLinks(text) {
  return text.split(/(hereducation\.org)/i).map((part, index) =>
    part.toLowerCase() === "hereducation.org" ? (
      <a key={index} href="https://hereducation.org" target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function latestNote(application) {
  const note = [...(application.meta.history || [])]
    .reverse()
    .find((item) => item.status && item.status !== "submitted" && item.status !== "draft" && String(item.note || "").trim());
  return note ? String(note.note).trim() : "";
}

export function SubmittedFund({ go, application }) {
  const status = application.meta.status;
  const waiting = !status || status === "draft" || status === "submitted" || status === "in_review";
  const meta = STATUS_META[status] || STATUS_META.submitted;
  const note = latestNote(application);

  return (
    <div className="page">
      <section className="wrap done-screen">
        <p className="eyebrow">The fund</p>
        <h1>Congrats, you submitted!</h1>
        <p className="lede">Look out for finalist status notifications.</p>
        {waiting ? null : <p className={`pill tone-${meta.tone}`}>{meta.label}</p>}
        {note ? <p>{note}</p> : null}
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => go("#apply/review")}>
            Read answers
          </button>
        </div>
      </section>
    </div>
  );
}

export default function Story({ go }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    document.documentElement.classList.add("is-story");
    document.body.classList.add("is-story");
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const slides = [...document.querySelectorAll(".fund-slide")];
    let holdTop = true;
    const release = window.setTimeout(() => {
      holdTop = false;
      window.scrollTo(0, 0);
      place();
    }, 180);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function place() {
      const height = window.innerHeight || 1;
      let nearestIndex = 0;
      let nearest = Infinity;
      slides.forEach((slide, index) => {
        const top = slide.getBoundingClientRect().top;
        if (Math.abs(top) < nearest) {
          nearest = Math.abs(top);
          nearestIndex = index;
        }
        if (reduce) {
          slide.style.setProperty("--in", "1");
          return;
        }
        const progress = 1 - top / height;
        const settled = Math.max(0, Math.min(1, progress));
        slide.style.setProperty("--in", settled.toFixed(3));
      });
      setCurrent((prev) => (prev === nearestIndex ? prev : nearestIndex));
    }

    function onScroll() {
      if (holdTop) {
        window.scrollTo(0, 0);
        return;
      }
      place();
    }
    place();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.clearTimeout(release);
      document.documentElement.classList.remove("is-story");
      document.body.classList.remove("is-story");
      history.scrollRestoration = previousRestoration;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", place);
    };
  }, []);

  function jump(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fund-scroll">
      <nav className="fund-progress" aria-label="Fund slides">
        {STORY.map((item, index) => (
          <button key={item.kicker} type="button" className={index === current ? "is-current" : ""} aria-current={index === current ? "true" : undefined} onClick={() => jump(`slide-${item.kicker}`)}>
            <span className="sr-only">{item.kicker}</span>
            <i>{String(index + 1).padStart(2, "0")}</i>
          </button>
        ))}
      </nav>
      {STORY.map((item, index) => {
        const last = index === STORY.length - 1;
        const from = ARRIVALS[index % ARRIVALS.length];
        const Guide = GUIDES[index];
        return (
          <section className={`fund-slide tone-${index}`} id={`slide-${item.kicker}`} key={item.kicker}>
            <span className="parallax-blob blob-a" aria-hidden="true" />
            <span className="parallax-blob blob-b" aria-hidden="true" />
            <div className={`slide-stage from-${from}`}>
              <div className="teacher-slot" data-from={from}>
                <Guide />
              </div>
              <article className="slide-copy">
                <p className="eyebrow">{item.kicker}</p>
                {index === 0 ? <h1>{item.title}</h1> : <h2>{item.title}</h2>}
                {item.steps ? (
                  <ol className="slide-steps">
                    {item.steps.map((step) => (
                      <li key={step}>{withLinks(step)}</li>
                    ))}
                  </ol>
                ) : (
                  item.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{withLinks(paragraph)}</p>
                  ))
                )}
                {last ? (
                  <button type="button" className="btn btn-primary story-quiz" onClick={() => go("#quiz")}>
                    Take eligibility quiz
                  </button>
                ) : (
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => jump(`slide-${STORY[index + 1].kicker}`)}>
                    Next
                  </button>
                )}
              </article>
            </div>
          </section>
        );
      })}
    </div>
  );
}

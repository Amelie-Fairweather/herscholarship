import { useEffect, useState } from 'react';

const SLIDES = [
  {
    src: '/slides/community-booth.jpg',
    alt: 'Two students holding a pink photo-booth frame that says take a pic',
  },
  {
    src: '/slides/community-her-cam-2.png',
    alt: 'Two students holding a pink camera frame labeled H.E.R. Cam',
  },
  {
    src: '/slides/community-her-cam-1.png',
    alt: 'Three students smiling through a pink camera frame labeled H.E.R. Cam',
  },
  {
    src: '/slides/community-photo-booth.jpg',
    alt: 'Six students behind a pink club table covered with handwritten posters',
  },
  {
    src: '/slides/community-classroom-bookmarks-board.jpg',
    alt: 'Five students standing together and smiling',
  },
  {
    src: '/slides/community-classroom-attendance.jpg',
    alt: 'A class of students posing in front of a chalkboard',
  },
  {
    src: '/slides/community-classroom.png',
    alt: 'Students gathered in a classroom beside a wall of paper quilts',
  },
  {
    src: '/slides/community-classroom-raised-hand.jpg',
    alt: 'A student raising her hand in class',
  },
  {
    src: '/slides/community-girls-rock-crafts.jpg',
    alt: 'Students in pink H.E.R. shirts standing in front of a welcome-back screen',
  },
  {
    src: '/slides/community-welcome-back-shirts.jpg',
    alt: 'Students in a classroom, one making something by hand while a screen shows the H.E.R. logo',
  },
  {
    src: '/slides/community-library-bookmarks.jpg',
    alt: 'A student cutting portrait bookmarks at a library table',
  },
  {
    src: '/slides/community-club-fair-knights.jpg',
    alt: 'A student placing a book on a library display',
  },
  {
    src: '/slides/community-cutting-flyers.jpg',
    alt: 'A whiteboard with a pink Her logo and the words women to learn about',
  },
  {
    src: '/slides/county-06-group.jpg',
    alt: 'A large group posing in front of a screen that says Her Education Required',
  },
  {
    src: '/slides/county-21.jpg',
    alt: 'Adults and students seated in a library, listening',
  },
  {
    src: '/slides/county-47.jpg',
    alt: 'A crowded library gathering, with people talking around tables',
  },
  {
    src: '/slides/13.JPG',
    alt: 'A student speaking into a microphone while others hold papers',
  },
  {
    src: '/slides/08.jpg',
    alt: 'A student on stage pointing a microphone toward the room, in front of a poster that says change starts now',
  },
  {
    src: '/slides/event13.jpg',
    alt: 'A student speaking on stage in front of a pink banner that says Her Education Required, thank you',
  },
  {
    src: '/slides/event8.jpg',
    alt: 'Two students hugging and smiling, holding yellow roses',
  },
  {
    src: '/slides/county-60.jpg',
    alt: 'Three students seated in front of a pink Her Education Required banner',
  },
];

function HeroSlides() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), reduced ? 7000 : 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <figure className="hero-figure hero-slides" aria-roledescription="carousel" aria-label="Photos from the fund">
      <div className="slide-window">
        <div className="slide-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {SLIDES.map((slide, i) => (
            <img key={slide.src} src={slide.src} alt={i === index ? slide.alt : ''} draggable="false" />
          ))}
        </div>
      </div>
    </figure>
  );
}

export default function Home({ go, account }) {
  const first = account?.name?.split(' ')[0];

  return (
    <div className="page">
      <section className="wrap hero">
        <div className="hero-copy">
          <img className="landing-logo" src="/her-logo.jpg" alt="H.E.R., an open book under the female symbol" />
          <p className="eyebrow">Scholarship fund</p>
          <h1>
            Her Education
            <em> Required.</em>
          </h1>
          <p className="lede">
            A $10,000 scholarship for a high school senior. Create an account, see what the fund is for, then take the
            eligibility quiz.
          </p>
          <div className="hero-actions">
            {account ? (
              <button type="button" className="btn btn-primary" onClick={() => go('#story')}>
                {first ? `${first}, open the fund` : 'Open the fund'}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-primary" onClick={() => go('#create')}>
                  Create account
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => go('#login')}>
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
        <HeroSlides />
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';

const SLIDES = [
  {
    src: '/slides/field-bake-sale.jpg',
    alt: 'Two students at an outdoor bake-sale table on a soccer field',
  },
  {
    src: '/slides/community-her-cam-1.png',
    alt: 'Three students smiling through a pink camera frame labeled H.E.R. Cam',
  },
  {
    src: '/slides/fundraiser-crafts.jpg',
    alt: 'Two students making crafts at a table covered with colored pencils and a glue stick',
  },
  {
    src: '/slides/08.jpg',
    alt: 'A student on stage pointing a microphone toward the room, in front of a poster that says change starts now',
  },
  {
    src: '/slides/hercam-group.jpg',
    alt: 'A group of students holding a pink frame labeled HERCAM',
  },
  {
    src: '/slides/county-21.jpg',
    alt: 'Adults and students seated in a library, listening',
  },
  {
    src: '/slides/bake-sale-four.jpg',
    alt: 'Four students behind a bake-sale table with muffins, cookies, and snacks',
  },
  {
    src: '/slides/community-classroom-raised-hand.jpg',
    alt: 'A student raising her hand in class',
  },
  {
    src: '/slides/laptops-vermont.jpg',
    alt: 'Two students working on laptops in a classroom',
  },
  {
    src: '/slides/community-photo-booth.jpg',
    alt: 'Six students behind a pink club table covered with handwritten posters',
  },
  {
    src: '/slides/classroom-projector.jpg',
    alt: 'Students seated at classroom tables while a projector hangs overhead',
  },
  {
    src: '/slides/event13.jpg',
    alt: 'A student speaking on stage in front of a pink banner that says Her Education Required, thank you',
  },
  {
    src: '/slides/bookmark-table.jpg',
    alt: 'Students around a table cutting and sorting pink bookmarks',
  },
  {
    src: '/slides/community-girls-rock-crafts.jpg',
    alt: 'Students in pink H.E.R. shirts standing in front of a welcome-back screen',
  },
  {
    src: '/slides/bake-sale-three.jpg',
    alt: 'Three students at a bake-sale table with handwritten H.E.R. signs',
  },
  {
    src: '/slides/13.JPG',
    alt: 'A student speaking into a microphone while others hold papers',
  },
  {
    src: '/slides/string-lights.jpg',
    alt: 'Students seated at desks in a classroom hung with string lights',
  },
  {
    src: '/slides/community-booth.jpg',
    alt: 'Two students holding a pink photo-booth frame that says take a pic',
  },
  {
    src: '/slides/county-06-group.jpg',
    alt: 'A large group posing in front of a screen that says Her Education Required',
  },
  {
    src: '/slides/community-library-bookmarks.jpg',
    alt: 'A student cutting portrait bookmarks at a library table',
  },
  {
    src: '/slides/event8.jpg',
    alt: 'Two students hugging and smiling, holding yellow roses',
  },
  {
    src: '/slides/community-her-cam-2.png',
    alt: 'Two students holding a pink camera frame labeled H.E.R. Cam',
  },
  {
    src: '/slides/county-47.jpg',
    alt: 'A crowded library gathering, with people talking around tables',
  },
  {
    src: '/slides/community-welcome-back-shirts.jpg',
    alt: 'Students in a classroom, one making something by hand while a screen shows the H.E.R. logo',
  },
  {
    src: '/slides/county-60.jpg',
    alt: 'Three students seated in front of a pink Her Education Required banner',
  },
  {
    src: '/slides/community-classroom-attendance.jpg',
    alt: 'A class of students posing in front of a chalkboard',
  },
  {
    src: '/slides/community-cutting-flyers.jpg',
    alt: 'A whiteboard with a pink Her logo and the words women to learn about',
  },
  {
    src: '/slides/community-classroom.png',
    alt: 'Students gathered in a classroom beside a wall of paper quilts',
  },
  {
    src: '/slides/community-club-fair-knights.jpg',
    alt: 'A student placing a book on a library display',
  },
  {
    src: '/slides/community-classroom-bookmarks-board.jpg',
    alt: 'Five students standing together and smiling',
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

export default function Home({ go, account, submitted }) {
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
            {submitted
              ? 'Your application is in. Open the fund to read your answers.'
              : 'A $10,000 annual scholarship aimed at promoting the advancement of high school aged students into higher education. Brought to you by students, for students ♡♡♡'}
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

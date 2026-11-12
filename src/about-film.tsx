import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play, ArrowUpRight } from "lucide-react";
import { assetUrl, media } from "./assets";

const chapters = [
  {
    label: "С 1999 года",
    title: "Здесь начался наш путь",
    text: "Адмирала Макарова, 26. Здесь мы работали 25 лет — с командой, увлечённой Mercedes-Benz.",
    image: media.history,
    alt: "Прежний техцентр Адмирал на Адмирала Макарова",
    duration: 6000,
  },
  {
    label: "Киевская, 14",
    title: "Опыт в каждой детали",
    text: "Сегодня наш основной техцентр находится на Киевской. Та же специализация — только Mercedes-Benz.",
    image: media.workshop,
    alt: "Ремонтная зона техцентра на Киевской",
    duration: 6000,
  },
  {
    label: "Два адреса",
    title: "Продолжаем движение",
    text: "15 ноября открывается вторая точка — Гостиничный проезд, 10А, строение 1.",
    image: media.workshop,
    alt: "Ремонтная зона Адмирала",
    duration: 6000,
  },
];

export function AboutFilm() {
  const root = useRef<HTMLElement>(null);
  const id = useId();
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const running = playing && visible && !reduced;
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && !document.hidden),
      { threshold: 0.25 },
    );
    if (root.current) observer.observe(root.current);
    const visibility = () =>
      setVisible(
        !document.hidden &&
          !!root.current &&
          root.current.getBoundingClientRect().bottom > 0 &&
          root.current.getBoundingClientRect().top < innerHeight,
      );
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(
      () => setCurrent((c) => (c + 1) % chapters.length),
      chapters[current].duration,
    );
    return () => clearTimeout(timer);
  }, [current, running]);
  return (
    <section
      className={`about-film ${running ? "is-playing" : "is-paused"}`}
      ref={root}
      aria-label="История техцентра в фотографиях"
    >
      <div className="about-film-screen">
        {chapters.map((chapter, i) => (
          <div
            key={chapter.label}
            id={`${id}-${i}`}
            className={`about-film-shot ${current === i ? "is-active" : ""} ${i === 2 ? "is-network" : ""}`}
            aria-hidden={current !== i}
          >
            <img
              src={assetUrl(chapter.image)}
              alt={chapter.alt}
              loading="lazy"
            />
            <div className="about-film-shade" />
            <div className="about-film-copy">
              <span>{chapter.label}</span>
              <h3>{chapter.title}</h3>
              <p>{chapter.text}</p>
            </div>
            {i === 2 && (
              <div className="about-film-addresses">
                <div>
                  <i />
                  <strong>Киевская, 14</strong>
                  <span>Основной техцентр</span>
                </div>
                <span className="about-film-route" />
                <div>
                  <i />
                  <strong>Гостиничный проезд</strong>
                  <span>Открытие 15 ноября</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <a
          className="about-film-link"
          href="#/about"
          aria-label="Подробнее об истории Адмирала"
        >
          <ArrowUpRight size={20} />
        </a>
      </div>
      <div className="about-film-controls">
        <div
          className="about-film-chapters"
          role="group"
          aria-label="Этапы истории"
        >
          {chapters.map((chapter, i) => (
            <button
              key={chapter.label}
              aria-pressed={current === i}
              aria-controls={`${id}-${i}`}
              onClick={() => {
                setCurrent(i);
                setPlaying(false);
              }}
            >
              <span className="about-film-progress">
                <i
                  key={`${current}-${running}`}
                  style={{ animationDuration: `${chapter.duration}ms` }}
                />
              </span>
              {chapter.label}
            </button>
          ))}
        </div>
        {!reduced && (
          <button
            className="about-film-play"
            aria-label={playing ? "Остановить историю" : "Продолжить историю"}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
        )}
      </div>
    </section>
  );
}

import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Tv,
  Check,
  Plus,
} from "lucide-react";
import { gsap } from "gsap";
import { PopularPrices } from "./price-list";
import { telegram, ContactLinks } from "./contact";
import { AboutFilm } from "./about-film";
import { HeroAtmosphere } from "./hero-atmosphere";
import { assetUrl, media } from "./assets";
import { history, services } from "./data";
import { BranchShowcase } from "./branch-showcase";
import { CrossfadeImage } from "./crossfade-image";
import { XrayImage } from "./xray-image";
import { HeroServiceHotspots } from "./hero-service-hotspots";
const picture = (path: string, alt: string, className = "") => (
  <img
    className={className}
    src={assetUrl(path)}
    alt={alt}
    loading="lazy"
    decoding="async"
  />
);
export function FigmaTimeline() {
  const [active, setActive] = useState(0);
  return (
    <section className="figma-history container">
      <div
        className="history-tabs"
        role="tablist"
        aria-label="История техцентра"
      >
        {history.map((h, i) => (
          <button
            key={h.year}
            id={`history-tab-${i}`}
            role="tab"
            aria-selected={active === i}
            aria-controls={`history-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const next =
                  (i + (e.key === "ArrowRight" ? 1 : -1) + history.length) %
                  history.length;
                setActive(next);
                document.getElementById(`history-tab-${next}`)?.focus();
              }
            }}
          >
            <span className="history-tab-point" />
            <strong>{h.year}</strong>
            <span>
              {["Адмирала Макарова, 26", "Киевская, 14", "Вторая точка"][i]}
            </span>
          </button>
        ))}
      </div>
      <div
        className="history-scene"
        role="tabpanel"
        id={`history-panel-${active}`}
        aria-labelledby={`history-tab-${active}`}
      >
        <figure>
          <CrossfadeImage
            src={assetUrl(active === 0 ? media.history : media.workshop)}
            alt={
              active === 0
                ? "Прежний техцентр Адмирал"
                : "Ремонтная зона Адмирала"
            }
          />
          <figcaption>
            {active === 2
              ? "Ремзона на Киевской и второй техцентр на Гостиничном проезде."
              : history[active].year}
          </figcaption>
        </figure>
        <div className="history-scene-copy" key={active}>
          <span className="history-large-year">{history[active].year}</span>
          <h3>{history[active].title}</h3>
          <p>{history[active].body}</p>
          <div className="history-nav">
            <button
              className="icon-button"
              aria-label="Предыдущий этап истории"
              onClick={() => setActive((active + 2) % 3)}
            >
              <ChevronLeft />
            </button>
            <span>{active + 1} / 3</span>
            <button
              className="icon-button"
              aria-label="Следующий этап истории"
              onClick={() => setActive((active + 1) % 3)}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
export function ApproachCards() {
  const items = [
    [
      "Только Mercedes",
      "Одна марка. Внимание к особенностям каждого поколения.",
    ],
    [
      "Оснащение техцентра",
      "Диагностика и ремонт в специализированной ремзоне.",
    ],
    ["Опыт мастеров", "Занимаемся автомобилями Mercedes-Benz с 1999 года."],
    [
      "Индивидуальный подход",
      "Учитываем историю, состояние автомобиля и Ваши задачи.",
    ],
    ["Подбор запчастей", "Варианты и стоимость согласуем перед началом работ."],
    [
      "Честность и открытость",
      "Объясняем причину неисправности и обсуждаем решение.",
    ],
  ];
  return (
    <div className="approach-sculptures">
      {items.map(([title, text], i) => (
        <details className="sculpture-card approach-sculpture" key={title}>
          <summary>
            <div className="sculpture-base" />
            {picture(media.approachIllustrations[i], "", "sculpture-image")}
            <h3>{title}</h3>
            <Plus size={17} />
          </summary>
          <p>{text}</p>
        </details>
      ))}
    </div>
  );
}
export function FigmaHome() {
  const root = useRef<HTMLDivElement>(null);
  const car = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion:no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap
          .timeline()
          .from(".fhero-subtitle", { autoAlpha: 0, y: 8, duration: 0.8 })
          .from(
            ".fhero-title",
            { y: 14, autoAlpha: 0, duration: 1.1, ease: "power3.out" },
            0.15,
          )
          .from(".fhero-actions", { autoAlpha: 0, y: 8, duration: 0.8 }, 0.35)
          .from(
            ".service-hero-car",
            { autoAlpha: 0, y: 16, duration: 1.2, ease: "power3.out" },
            0.15,
          );
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  return (
    <div className="figma-home" ref={root}>
      <section className="service-hero">
        <HeroAtmosphere />
        <div className="container service-hero-grid">
          <div className="service-hero-copy">
            <p className="eyebrow fhero-subtitle">
              Москва · Только Mercedes-Benz · С 1999 года
            </p>
            <h1 className="fhero-title">
              Ремонт и обслуживание <span>Mercedes-Benz</span>
            </h1>
            <p className="service-hero-description">
              ТО и ремонт любой сложности. Двигатель, ходовая, электрика, кузов
              и детейлинг.
            </p>
            <div className="fhero-actions">
              <ContactLinks compact />
              <a className="text-link" href="#/services">
                Услуги и цены <ArrowRight size={17} />
              </a>
            </div>
          </div>
          <div className="service-hero-visual" ref={car}>
            <span className="hero-visual-label" aria-hidden="true">
              MERCEDES-BENZ ONLY
            </span>
            <XrayImage
              className="service-hero-car"
              src={media.hero}
              cutaway="media/xray/hero-v2.webp"
              alt="Mercedes-Benz — ремонт и обслуживание в техцентре Адмирал"
              priority
              showControls={false}
            >
              <HeroServiceHotspots />
            </XrayImage>
            <div
              className="hero-service-links"
              aria-label="Услуги для Вашего автомобиля"
            >
              <a href="#/services/maintenance">
                <span>ТО Mercedes-Benz</span>
                <strong>
                  от 7 750 ₽ <ArrowUpRight size={15} />
                </strong>
              </a>
              <a href="#/services/diagnostics">
                <span>Диагностика Xentry</span>
                <strong>
                  от 3 700 ₽ <ArrowUpRight size={15} />
                </strong>
              </a>
              <a href="#/services/suspension">
                <span>Ходовая и тормоза</span>
                <strong>
                  Колодки от 4 550 ₽ <ArrowUpRight size={15} />
                </strong>
              </a>
              <a href="#/services/body">
                <span>Кузов и детейлинг</span>
                <strong>
                  Все направления <ArrowUpRight size={15} />
                </strong>
              </a>
            </div>
            <p className="hero-price-note">
              Цены за работу. Запчасти и материалы — отдельно.
            </p>
          </div>
        </div>
        <div className="container hero-bottomline">
          <span>27 лет специализации на Mercedes-Benz</span>
          <a href="#/contacts">
            Два техцентра в Москве <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
      <PopularPrices />
      <section className="figma-who container section" id="intro">
        <div className="figma-centered-heading" data-reveal>
          <h2>КТО МЫ</h2>
          <p>
            Профильный сервис только для Mercedes-Benz с 1999 года.
            <br />
            27 лет опыта, внимание к автомобилю и понятный разговор с
            владельцем.
          </p>
        </div>
        <AboutFilm />
        <div className="figma-facts" data-reveal>
          <span>
            <strong>27</strong>лет опыта
          </span>
          <span>
            <strong>1999</strong>год основания
          </span>
          <span>
            <strong>2</strong>адреса в Москве
          </span>
        </div>
        <a href="#/about" className="text-link">
          Больше о техцентре
          <ArrowUpRight size={17} />
        </a>
      </section>
      <BranchShowcase />
      <section className="figma-service-section container section">
        <div className="figma-centered-heading" data-reveal>
          <h2>ВСЁ ДЛЯ ВАШЕГО MERCEDES</h2>
          <p>
            Техника, кузов, электрика, дооснащение и детейлинг.
            <br />
            Выберите направление — обсудим работы для Вашего автомобиля.
          </p>
        </div>
        <div className="figma-service-links">
          {services.map((s, i) => (
            <a
              href={`#/services/${s.id}`}
              className="sculpture-card"
              key={s.id}
            >
              <div className="sculpture-base" />
              {picture(media.serviceIllustrations[i], "", "sculpture-image")}
              <h3>{s.short}</h3>
              <ArrowUpRight className="card-arrow" size={17} />
            </a>
          ))}
        </div>
        <a className="button" href="#/services">
          Смотреть услуги и цены
          <ArrowUpRight size={17} />
        </a>
      </section>
      <section className="figma-comfort container">
        <div data-reveal>
          <h2>
            ВАШ КОМФОРТ —<br />
            ТОЖЕ ЧАСТЬ СЕРВИСА
          </h2>
          <p>
            Обсудите задачу с приёмщиком. А пока мы занимаемся автомобилем —
            кофе, телевизор и время для себя.
          </p>
        </div>
        <div className="figma-amenities">
          <span>
            <Coffee strokeWidth={1} />
            Кофе
          </span>
          <span>
            <Tv strokeWidth={1} />
            Зона ожидания
          </span>
          <span>
            <Check strokeWidth={1} />
            Личное общение
          </span>
        </div>
      </section>
      <section className="figma-final-cta container section" data-reveal>
        <h2>
          ВАШ МЕРСЕДЕС —<br />
          НАША ОТВЕТСТВЕННОСТЬ
        </h2>
        <a
          className="button"
          href={telegram}
          target="_blank"
          rel="noopener noreferrer"
        >
          Написать в Telegram
          <ArrowUpRight size={17} />
        </a>
      </section>
    </div>
  );
}

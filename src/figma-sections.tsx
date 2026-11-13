import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { XrayImage } from "./xray-image";
import { AboutFilm } from "./about-film";
import { HeroAtmosphere } from "./hero-atmosphere";
import { CarAssembly } from "./car-assembly";
import { assetUrl, media } from "./assets";
import { history, services } from "./data";
import { BranchShowcase } from "./branch-showcase";
import { CrossfadeImage } from "./crossfade-image";
type Booking = { service?: string; branch?: string; model?: string };
type Props = { onBook: (booking?: Booking) => void };
const picture = (path: string, alt: string, className = "") => (
  <img
    className={className}
    src={assetUrl(path)}
    alt={alt}
    loading="lazy"
    decoding="async"
  />
);
export function PromotionCarousel({ onBook }: Props) {
  const [active, setActive] = useState(0);
  const touch = useRef<number | null>(null);
  const offers = [
    {
      title: "Первое знакомство",
      text: "Познакомьтесь с техцентром и обсудите Ваш автомобиль.",
      image: media.promotions[0],
      service: "",
    },
    {
      title: "Диагностика ходовой",
      text: "Предложение для первого визита. Условия уточните при записи.",
      image: media.promotions[1],
      service: "suspension",
    },
    {
      title: "Компьютерная диагностика",
      text: "Предложение для новых клиентов. Условия уточните при записи.",
      image: media.promotions[2],
      service: "diagnostics",
    },
  ];
  const move = (delta: number) =>
    setActive((i) => (i + delta + offers.length) % offers.length);
  return (
    <section
      className="figma-offers container"
      aria-label="Предложения первого визита"
    >
      <h2 data-reveal>
        ПЕРВОЕ ЗНАКОМСТВО —<br />
        БЕСПЛАТНО
      </h2>
      <div
        className="offer-carousel"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current !== null) {
            const d = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(d) > 45) {
              e.preventDefault();
              move(d < 0 ? 1 : -1);
            }
          }
          touch.current = null;
        }}
      >
        <button
          className="icon-button offer-prev"
          aria-label="Предыдущее предложение"
          onClick={() => move(-1)}
        >
          <ChevronLeft />
        </button>
        <div className="offer-cards">
          {offers.map((offer, i) => (
            <button
              key={offer.title}
              className={`sculpture-card offer-card ${i === active ? "selected" : ""}`}
              onClick={() => {
                setActive(i);
                onBook({ service: offer.service || undefined });
              }}
              aria-label={`${offer.title}: записаться`}
              aria-describedby={`offer-note-${i}`}
            >
              <div className="sculpture-base" />
              {picture(offer.image, "", "sculpture-image")}
              <h3>{offer.title}</h3>
              <p id={`offer-note-${i}`}>{offer.text}</p>
              <ArrowUpRight className="card-arrow" size={18} />
            </button>
          ))}
        </div>
        <button
          className="icon-button offer-next"
          aria-label="Следующее предложение"
          onClick={() => move(1)}
        >
          <ChevronRight />
        </button>
      </div>
      <div className="offer-dots" aria-label="Выбор предложения">
        {offers.map((o, i) => (
          <button
            aria-label={o.title}
            aria-pressed={i === active}
            key={o.title}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
      <p className="offer-conditions">
        Вид бесплатной диагностики, условия и доступное время уточните при
        записи.
      </p>
    </section>
  );
}
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
              ? "Ремзона на Киевской. Вторая точка — с 15 ноября."
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
export function FigmaHome({ onBook }: Props) {
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
          .from(".fhero-actions", { autoAlpha: 0, y: 8, duration: 0.8 }, 0.85);
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  useEffect(() => {
    if (!car.current) return;
    const el = car.current;
    const move = (e: PointerEvent) => {
      if (
        !matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
          .matches
      )
        return;
      const r = el.getBoundingClientRect();
      el.style.setProperty(
        "--mx",
        `${(e.clientX - r.left - r.width / 2) * 0.018}px`,
      );
      el.style.setProperty(
        "--my",
        `${(e.clientY - r.top - r.height / 2) * 0.01}px`,
      );
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);
  return (
    <div className="figma-home" ref={root}>
      <section className="fhero">
        <HeroAtmosphere />
        <div
          className="fhero-background"
          style={{ backgroundImage: `url(${assetUrl(media.atmosphere)})` }}
        />
        <img
          className="fhero-emblem fhero-emblem-left"
          src={assetUrl(media.symbols[0])}
          alt=""
        />
        <img
          className="fhero-emblem fhero-emblem-small"
          src={assetUrl(media.symbols[1])}
          alt=""
        />
        <img
          className="fhero-emblem fhero-emblem-right"
          src={assetUrl(media.symbols[2])}
          alt=""
        />
        <div className="container fhero-content">
          <p className="fhero-subtitle">Ремонт и обслуживание только</p>
          <h1 className="fhero-title">MERCEDES-BENZ</h1>
          <div className="fhero-car-area" ref={car}>
            <CarAssembly>
              <XrayImage
                className="fhero-car"
                src={media.hero}
                alt="Серебристый Mercedes-Benz — ТехЦентр Адмирал"
                priority
                cutaway="media/xray/hero-v2.webp"
              >
                <a
                  href="#/services"
                  className="hero-node hero-node-engine"
                  aria-label="Посмотреть диагностику и услуги"
                >
                  <span>
                    <Plus size={14} />
                  </span>
                  <em>Диагностика и ремонт</em>
                </a>
                <a
                  href="#/services/suspension"
                  className="hero-node hero-node-wheel"
                  aria-label="Услуги по ходовой и тормозам"
                >
                  <span>
                    <Plus size={14} />
                  </span>
                  <em>Ходовая и тормоза</em>
                </a>
              </XrayImage>
            </CarAssembly>
          </div>
          <div className="fhero-actions">
            <button className="button" onClick={() => onBook()}>
              Записаться
              <ArrowUpRight size={16} />
            </button>
            <a className="fhero-services" href="#/services">
              Выбрать свой Mercedes
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>
      <PromotionCarousel onBook={onBook} />
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
      <BranchShowcase onBook={(branch) => onBook({ branch })} />
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
          Выбрать модель Mercedes
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
          ПРИЕЗЖАЙТЕ ПОЗНАКОМИТЬСЯ С НАМИ —<br />
          ЭТО АБСОЛЮТНО БЕСПЛАТНО
        </h2>
        <button className="button" onClick={() => onBook()}>
          Записаться онлайн
          <ArrowUpRight size={17} />
        </button>
      </section>
    </div>
  );
}

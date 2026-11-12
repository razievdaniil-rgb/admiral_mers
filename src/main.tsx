import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Menu,
  Phone,
  MapPin,
  Clock3,
  ScanLine,
  Wrench,
  Cog,
  Disc3,
  Zap,
  CarFront,
  Settings2,
  Sparkles,
  Coffee,
  Tv,
  Check,
  ShieldCheck,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./fonts.css";
import {
  allServices,
  branches,
  branchStatus,
  history,
  mapLink,
  models,
  phone,
  services,
  telephone,
  type Service,
} from "./data";
import { assetUrl, media } from "./assets";
import "./style.css";

gsap.registerPlugin(ScrollTrigger);
type Booking = { service?: string; model?: string; branch?: string };
const BookContext = createContext<(b?: Booking) => void>(() => {});
const useBook = () => useContext(BookContext);
const icons = {
  scan: ScanLine,
  wrench: Wrench,
  engine: Cog,
  disc: Disc3,
  bolt: Zap,
  car: CarFront,
  settings: Settings2,
  sparkles: Sparkles,
};
const nav = [
  ["/", "Главная"],
  ["/services", "Услуги"],
  ["/about", "О нас"],
  ["/contacts", "Контакты"],
];

function Logo() {
  return (
    <a href="#/" className="logo" aria-label="Адмирал — на главную">
      {media.logo ? (
        <img
          src={assetUrl(media.logo)}
          width="223"
          height="42"
          alt="Адмирал. Ремонт и обслуживание Mercedes-Benz с 1999 года"
        />
      ) : (
        <>
          <strong>АДМИРАЛ</strong>
          <span>ТЕХЦЕНТР · MERCEDES-BENZ ONLY</span>
        </>
      )}
    </a>
  );
}
function BookButton({
  children = "Записаться",
  booking,
  className = "",
}: {
  children?: React.ReactNode;
  booking?: Booking;
  className?: string;
}) {
  const book = useBook();
  return (
    <button className={`button ${className}`} onClick={() => book(booking)}>
      {children}
      <ArrowUpRight size={19} />
    </button>
  );
}
function Image({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return src ? (
    <img
      className={className}
      src={assetUrl(src)}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
    />
  ) : (
    <div className={`image-fallback ${className}`} aria-hidden="true">
      <span>MERCEDES-BENZ ONLY</span>
    </div>
  );
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span />
      {children}
    </p>
  );
}
function Header({ route }: { route: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = [
      document.querySelector("main"),
      document.querySelector("footer"),
    ].filter(Boolean) as HTMLElement[];
    background.forEach((el) => (el.inert = true));
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === "Tab") {
        const items = [
          ...document.querySelectorAll<HTMLElement>(".header a,.header button"),
        ].filter((el) => el.getClientRects().length > 0);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      background.forEach((el) => (el.inert = false));
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <header className="header">
      <div className="header-inner container">
        <Logo />
        <nav className="desktop-nav" aria-label="Основная навигация">
          {nav.map(([path, label]) => (
            <a
              key={path}
              href={`#${path}`}
              aria-current={
                (path === "/" ? route === "/" : route.startsWith(path))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </a>
          ))}
        </nav>
        <a className="header-phone" href={telephone}>
          <span>Ежедневно · 09:00–20:00</span>
          {phone}
        </a>
        <div className="header-book">
          <BookButton />
        </div>
        <button
          ref={toggle}
          className="icon-button menu-toggle"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          className="mobile-menu"
          aria-label="Мобильная навигация"
        >
          {nav.map(([path, label]) => (
            <a key={path} href={`#${path}`} onClick={() => setOpen(false)}>
              {label}
              <ArrowUpRight />
            </a>
          ))}
          <a href={telephone}>
            {phone}
            <Phone size={20} />
          </a>
          <p>Только Mercedes-Benz. С 1999 года.</p>
        </nav>
      )}
    </header>
  );
}
function Footer() {
  return (
    <footer className="footer container">
      <div className="footer-top">
        <Logo />
        <nav aria-label="Навигация в подвале">
          {nav.map(([path, label]) => (
            <a key={path} href={`#${path}`}>
              {label}
            </a>
          ))}
        </nav>
        <a href={telephone}>
          {phone}
          <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ТехЦентр Адмирал</span>
        <span>Независимый специализированный сервис Mercedes-Benz</span>
        <a href="#/privacy">О персональных данных</a>
      </div>
    </footer>
  );
}
function Intro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="page-intro container">
      <div className="breadcrumbs">
        <a href="#/">Главная</a>
        <span>/</span>
        <span>{eyebrow}</span>
      </div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{title}</h1>
      {description && <p className="lead">{description}</p>}
    </section>
  );
}
function CTA() {
  return (
    <section className="cta-section container" data-reveal>
      <Eyebrow>Начнём со знакомства</Eyebrow>
      <h2>
        Ваш Mercedes.
        <br />
        <span>Наша ответственность.</span>
      </h2>
      <div className="cta-bottom">
        <p>
          Расскажите, что беспокоит автомобиль.
          <br />
          Вместе определим следующий шаг.
        </p>
        <BookButton>Выбрать время</BookButton>
      </div>
    </section>
  );
}
function BranchCards() {
  return (
    <div className="branch-grid">
      {branches.map((b) => (
        <article className="branch-card" key={b.id} data-reveal>
          <div className="branch-top">
            <MapPin size={22} />
            <span className={b.new ? "branch-status new" : "branch-status"}>
              {branchStatus(b.new)}
            </span>
          </div>
          <p className="eyebrow">{b.label}</p>
          <h3>
            {b.name}
            <ArrowUpRight size={28} />
          </h3>
          <p>{b.address.replace("Москва, ", "")}</p>
          <div className="branch-actions">
            <a href={mapLink(b.address)} target="_blank" rel="noreferrer">
              Построить маршрут
              <ArrowUpRight size={16} />
            </a>
            <BookButton booking={{ branch: b.id }} className="text-button">
              Записаться
            </BookButton>
          </div>
        </article>
      ))}
    </div>
  );
}
function ServiceGrid({
  selectedModel = "",
  compact = false,
}: {
  selectedModel?: string;
  compact?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className={`service-grid ${compact ? "compact" : ""}`}>
      {services.map((s) => {
        const Icon = icons[s.icon as keyof typeof icons];
        return (
          <article
            className={`service-card ${active === s.id ? "expanded" : ""}`}
            key={s.id}
            data-reveal
          >
            <button
              className="service-toggle"
              onClick={() => setActive(active === s.id ? null : s.id)}
              aria-expanded={active === s.id}
              aria-controls={`works-${s.id}`}
            >
              <Icon size={34} strokeWidth={1.15} />
              <span>{s.short}</span>
              <Plus className="service-plus" size={21} />
            </button>
            <div
              className="service-content"
              id={`works-${s.id}`}
              hidden={active !== s.id}
            >
              <ul>
                {s.works.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <a
                className="text-link"
                href={`#/services/${s.id}${selectedModel ? "?model=" + encodeURIComponent(selectedModel) : ""}`}
              >
                Подробнее об услуге
                <ArrowRight size={17} />
              </a>
              {s.id === "engine" && (
                <a
                  className="text-link"
                  href={`#/services/transmission${selectedModel ? "?model=" + encodeURIComponent(selectedModel) : ""}`}
                >
                  Ремонт трансмиссии
                  <ArrowRight size={17} />
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
function Timeline() {
  return (
    <div className="timeline">
      {history.map((h, i) => (
        <article key={h.year} className="timeline-item" data-reveal>
          <div className="timeline-point" />
          <span className="timeline-year">{h.year}</span>
          <h3>{h.title}</h3>
          <p>{h.body}</p>
          <span className="timeline-caption">
            {
              [
                "Адмирала Макарова, 26",
                "Киевская, 14",
                "Гостиничный проезд, 10А",
              ][i]
            }
          </span>
        </article>
      ))}
    </div>
  );
}
function Home() {
  const root = useRef<HTMLDivElement>(null);
  const pointer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 900px)",
      },
      (ctx) => {
        const { motion, desktop } = ctx.conditions!;
        if (!motion) return;
        const tl = gsap.timeline();
        tl.from(".hero-kicker", { opacity: 0, y: 18, duration: 0.7 })
          .from(
            ".hero-title",
            { yPercent: 50, opacity: 0, duration: 1, ease: "power3.out" },
            0.1,
          )
          .from(
            ".hero-car",
            {
              opacity: 0,
              y: 55,
              scale: 0.94,
              duration: 1.3,
              ease: "power3.out",
            },
            0.25,
          )
          .from(".hero-bottom", { opacity: 0, y: 18, duration: 0.8 }, 0.8);
        if (desktop) {
          gsap.to(".hero-car", {
            y: 70,
            scale: 1.06,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
          gsap.to(".hero-title", {
            y: -45,
            opacity: 0.25,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
        }
      },
      root,
    );
    return () => mm.revert();
  }, []);
  return (
    <div ref={root}>
      <section
        className="hero"
        onPointerMove={(e) => {
          if (
            !matchMedia(
              "(pointer:fine) and (prefers-reduced-motion:no-preference)",
            ).matches
          )
            return;
          const r = e.currentTarget.getBoundingClientRect();
          pointer.current?.style.setProperty(
            "--mx",
            `${(e.clientX - r.left - r.width / 2) * 0.012}px`,
          );
          pointer.current?.style.setProperty(
            "--my",
            `${(e.clientY - r.top - r.height / 2) * 0.008}px`,
          );
        }}
      >
        <div
          className="hero-atmosphere"
          style={{
            backgroundImage: media.atmosphere
              ? `url(${assetUrl(media.atmosphere)})`
              : undefined,
          }}
        />
        <div className="hero-light" />
        <div className="hero-orbit" aria-hidden="true" />
        <div className="container hero-content">
          <div className="hero-kicker">
            <Eyebrow>ТехЦентр Адмирал · Москва</Eyebrow>
            <span>Ремонт и обслуживание только</span>
          </div>
          <h1 className="hero-title">MERCEDES-BENZ</h1>
          <div className="hero-car-wrap" ref={pointer}>
            <Image
              src={media.hero}
              alt="Серебристый Mercedes-Benz — профильный сервис Адмирал"
              className="hero-car"
              eager
            />
            <div className="tech-label tech-label-left">
              <span className="crosshair" />
              Точность в каждой детали
            </div>
            <div className="tech-label tech-label-right">
              Mercedes-Benz only
              <span className="crosshair" />
            </div>
          </div>
          <div className="hero-bottom">
            <div className="hero-story">
              <span className="hero-year">1999</span>
              <p>
                Семейное дело.
                <br />
                Одна марка. 27 лет опыта.
              </p>
            </div>
            <div className="hero-actions">
              <BookButton />
              <a href="#/services" className="button secondary">
                Выбрать услугу
                <ArrowUpRight size={19} />
              </a>
            </div>
            <a
              href="#intro"
              className="scroll-cue"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("intro")
                  ?.scrollIntoView({
                    behavior: matchMedia("(prefers-reduced-motion:reduce)")
                      .matches
                      ? "instant"
                      : "smooth",
                  });
              }}
              aria-label="Узнать о техцентре"
            >
              <ArrowDown size={20} />
            </a>
          </div>
        </div>
      </section>
      <section className="intro-section container section" id="intro">
        <div className="section-heading" data-reveal>
          <Eyebrow>Своим автомобилем вы доверяете людям</Eyebrow>
          <h2>
            Одну марку можно
            <br />
            знать <span>по-настоящему.</span>
          </h2>
        </div>
        <div className="intro-layout">
          <figure className="workshop-image" data-reveal>
            <Image
              src={media.workshop}
              alt="Ремонтная зона техцентра Адмирал на Киевской"
            />
            <figcaption>
              <span>Киевская, 14</span>
              <span>
                Mercedes-Benz only
                <ArrowUpRight size={15} />
              </span>
            </figcaption>
          </figure>
          <div className="intro-copy" data-reveal>
            <span className="big-number">
              27<span>лет</span>
            </span>
            <h3>
              Не просто сервис.
              <br />
              Дело нашей семьи.
            </h3>
            <p>
              С 1999 года мы занимаемся только Mercedes-Benz. За эти годы
              менялись поколения автомобилей и адреса. Наше отношение к работе
              осталось прежним.
            </p>
            <p>
              Сначала разобраться. Объяснить владельцу. Согласовать решение. И
              только потом — ремонтировать.
            </p>
            <a href="#/about" className="text-link">
              Познакомиться с Адмиралом
              <ArrowUpRight size={20} />
            </a>
          </div>
        </div>
      </section>
      <section className="locations-section section">
        <div className="container">
          <div className="section-heading split" data-reveal>
            <div>
              <Eyebrow>Теперь в двух точках Москвы</Eyebrow>
              <h2>
                Ближе к вам.
                <br />
                <span>Верны себе.</span>
              </h2>
            </div>
            <p>
              Один подход к работе.
              <br />
              Два адреса для вашего Mercedes.
            </p>
          </div>
          <BranchCards />
        </div>
      </section>
      <section className="section container">
        <div className="section-heading split" data-reveal>
          <div>
            <Eyebrow>Весь автомобиль — в одних руках</Eyebrow>
            <h2>
              От диагностики
              <br />
              <span>до последней детали.</span>
            </h2>
          </div>
          <a href="#/services" className="text-link">
            Все услуги и модели
            <ArrowUpRight size={20} />
          </a>
        </div>
        <ServiceGrid compact />
      </section>
      <section className="first-visit section">
        <div className="container visit-layout">
          <div data-reveal>
            <Eyebrow>Первый визит в Адмирал</Eyebrow>
            <h2>
              Знакомство,
              <br />с которого
              <br />
              <span>начинается доверие.</span>
            </h2>
            <p>
              Бесплатная диагностика при первом визите.
              <br />
              Вид диагностики и условия предложения уточните при записи.
            </p>
            <BookButton booking={{ service: "diagnostics" }}>
              Записаться на знакомство
            </BookButton>
          </div>
          <div className="visit-visual" data-reveal>
            <Image
              src={media.diagnosticIllustration}
              alt="Компьютерная диагностика Mercedes-Benz"
            />
            <div className="visit-tag">
              <ScanLine size={20} />
              <span>
                Сначала понять.
                <br />
                Потом действовать.
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="comfort container section">
        <div className="comfort-copy" data-reveal>
          <Eyebrow>Пока мы заботимся об автомобиле</Eyebrow>
          <h2>
            Можно просто
            <br />
            <span>выдохнуть.</span>
          </h2>
          <p>
            Обсудите задачу с приёмщиком, выпейте кофе и устройтесь перед
            телевизором. Мы понимаем, что ваше время тоже требует внимания.
          </p>
          <div className="comfort-amenities">
            <span>
              <Coffee />
              Кофе
            </span>
            <span>
              <Tv />
              Зона ожидания
            </span>
            <span>
              <Check />
              Личное общение
            </span>
          </div>
        </div>
        <div className="comfort-art" data-reveal>
          <span className="comfort-word">
            ONLY
            <br />
            <i>MERCEDES.</i>
          </span>
          <p>
            Узкая специализация.
            <br />
            Широкий взгляд на заботу.
          </p>
        </div>
      </section>
      <CTA />
    </div>
  );
}
function InteractiveVehicle({ src, model }: { src: string; model: string }) {
  const [active, setActive] = useState<string | null>(null);
  const points = [
    { id: "engine", label: "Двигатель", x: 29, y: 43 },
    { id: "suspension", label: "Ходовая и тормоза", x: 23, y: 70 },
    { id: "electrics", label: "Электрика", x: 51, y: 33 },
    { id: "diagnostics", label: "Диагностика", x: 74, y: 60 },
  ];
  const service = services.find((s) => s.id === active);
  return (
    <div className="interactive-vehicle">
      <div className="vehicle-frame">
        <Image src={src} alt={`Mercedes-Benz ${model}`} />
        {points.map((p) => (
          <button
            key={p.id}
            className={`hotspot ${active === p.id ? "active" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            aria-label={`Узел: ${p.label}`}
            aria-expanded={active === p.id}
            aria-controls="vehicle-node-panel"
            onClick={() => setActive(active === p.id ? null : p.id)}
          >
            <Plus size={14} />
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      <div className="node-panel" id="vehicle-node-panel" aria-live="polite">
        {service ? (
          <>
            <div>
              <span className="node-label">{model}</span>
              <h3>{service.short}</h3>
              <p>{service.works.slice(0, 2).join(" · ")}</p>
            </div>
            <a
              className="text-link"
              href={`#/services/${service.id}?model=${encodeURIComponent(model)}`}
            >
              Смотреть работы
              <ArrowUpRight size={18} />
            </a>
          </>
        ) : (
          <p className="node-hint">
            <Plus size={17} />
            Нажмите на узел автомобиля, чтобы посмотреть работы
          </p>
        )}
      </div>
    </div>
  );
}
function Catalog() {
  const [modelId, setModelId] = useState("e");
  const [generation, setGeneration] = useState("W213");
  const model = models.find((m) => m.id === modelId)!;
  const index = models.indexOf(model);
  const select = (id: string) => {
    const m = models.find((x) => x.id === id)!;
    setModelId(id);
    setGeneration(
      m.generations.find((g) => media.models[`${id}-${g}`]) ||
        m.generations.at(-1)!,
    );
  };
  const move = (direction: number) =>
    select(models[(index + direction + models.length) % models.length].id);
  const car = media.models[`${modelId}-${generation}`] || "";
  return (
    <>
      <section className="catalog container">
        <div
          className="model-presets"
          aria-label="Модели с интерактивной схемой"
        >
          {[
            ["e", "E-Класс W213"],
            ["s", "S-Класс W222"],
            ["gle", "GLE / ML W166"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={modelId === id ? "active" : ""}
              onClick={() => select(id)}
            >
              {label}
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
        <div className="catalog-toolbar">
          <label>
            Ваш Mercedes
            <select value={modelId} onChange={(e) => select(e.target.value)}>
              {models.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Поколение / кузов
            <select
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
            >
              {model.generations.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <span className="catalog-count">
            {String(index + 1).padStart(2, "0")} / {models.length}
          </span>
        </div>
        <div
          className="model-stage"
          tabIndex={0}
          role="group"
          aria-label="Витрина моделей. Стрелки влево и вправо переключают классы."
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "ArrowRight") {
              e.preventDefault();
              move(1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              move(-1);
            }
          }}
        >
          <div className="model-head" aria-live="polite">
            <span>{model.kind}</span>
            <h2 key={model.id}>
              {model.name}
              <small>{generation}</small>
            </h2>
          </div>
          <button
            className="icon-button prev-model"
            aria-label="Предыдущий класс"
            onClick={() => move(-1)}
          >
            <ChevronLeft />
          </button>
          <div className="model-image" key={`${modelId}-${generation}`}>
            {car ? (
              <InteractiveVehicle
                src={car}
                model={`${model.name} ${generation}`}
              />
            ) : (
              <div className="model-type">
                <CarFront size={82} strokeWidth={0.65} />
                <span>{generation}</span>
                <p>Mercedes-Benz {model.name}</p>
              </div>
            )}
          </div>
          <button
            className="icon-button next-model"
            aria-label="Следующий класс"
            onClick={() => move(1)}
          >
            <ChevronRight />
          </button>
          <div className="model-stage-footer">
            <span>Только Mercedes-Benz</span>
            <BookButton
              className="secondary"
              booking={{ model: `${model.name} ${generation}` }}
            >
              Обсудить автомобиль
            </BookButton>
          </div>
        </div>
        <p className="catalog-note">
          Основные классы и поколения. Если вашего автомобиля нет в списке,
          позвоните нам. Применимость работ и комплектацию уточним по VIN.
        </p>
      </section>
      <section className="container catalog-services section">
        <div className="section-heading" data-reveal>
          <Eyebrow>Что требуется автомобилю?</Eyebrow>
          <h2>
            Выберите <span>направление.</span>
          </h2>
          <p>
            Категории работ общие. Точный перечень для {model.name} {generation}{" "}
            определим после обращения.
          </p>
        </div>
        <ServiceGrid selectedModel={`${model.name} ${generation}`} />
      </section>
    </>
  );
}
function ServicesPage() {
  return (
    <>
      <Intro
        eyebrow="Услуги"
        title="Знаем ваш Mercedes."
        description="От компактного A-Класса до коммерческого Sprinter. Выберите автомобиль и расскажите, какая помощь нужна."
      />
      <Catalog />
      <CTA />
    </>
  );
}
function FAQ({ items }: { items: [string, string][] }) {
  return (
    <section className="faq section container">
      <div data-reveal>
        <Eyebrow>Перед визитом</Eyebrow>
        <h2>
          Есть
          <br />
          <span>вопросы?</span>
        </h2>
        <a href={telephone} className="text-link">
          Обсудить с мастером
          <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="faq-list">
        {items.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <Plus size={22} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
function ServicePage({ service, model }: { service: Service; model: string }) {
  const Icon = icons[service.icon as keyof typeof icons];
  return (
    <>
      <Intro
        eyebrow="Услуги"
        title={service.title}
        description={service.intro}
      />
      <section className="service-detail container">
        <div className="service-photo" data-reveal>
          <Image
            src={media.service}
            alt="Специалисты проводят диагностику автомобиля Mercedes-Benz"
          />
          <span>
            <Icon size={26} />
            ТехЦентр Адмирал
          </span>
        </div>
        <div className="service-detail-copy" data-reveal>
          {model && (
            <p className="selected-model">
              <CarFront size={18} />
              {model}
            </p>
          )}
          <Eyebrow>Что можем сделать</Eyebrow>
          <ul>
            {service.works.map((w) => (
              <li key={w}>
                <Check size={18} />
                {w}
              </li>
            ))}
          </ul>
          <p>
            Стоимость, сроки и объём работ согласуем после диагностики. Без
            ремонта, о котором вы не договаривались.
          </p>
          <BookButton booking={{ service: service.id, model }}>
            Обсудить {service.id === "maintenance" ? "обслуживание" : "работы"}
          </BookButton>
          <a className="back-link" href="#/services">
            <ChevronLeft size={17} />К списку услуг
          </a>
        </div>
      </section>
      <section className="process container section">
        <Eyebrow>Понятный порядок</Eyebrow>
        <div>
          {[
            ["01", "Знакомимся", "Вы рассказываете о машине и задаче."],
            ["02", "Проверяем", "Находим причину и обсуждаем решение."],
            ["03", "Согласовываем", "Фиксируем перечень, стоимость и сроки."],
          ].map(([n, t, d]) => (
            <article key={n} data-reveal>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <FAQ items={service.faq} />
      <CTA />
    </>
  );
}
function AboutPage() {
  return (
    <>
      <Intro
        eyebrow="О нас"
        title="Семейное дело. С 1999 года."
        description="Адмирал — история людей, которые выбрали одну марку и остались ей верны."
      />
      <section className="about-cover container" data-reveal>
        <Image
          src={media.history}
          alt="ТехЦентр Адмирал — фотография из истории сервиса"
        />
        <div>
          <span>27</span>
          <p>лет с Mercedes-Benz</p>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading" data-reveal>
          <Eyebrow>Наш путь</Eyebrow>
          <h2>
            Менялись адреса.
            <br />
            <span>Оставалось главное.</span>
          </h2>
        </div>
        <Timeline />
      </section>
      <section className="about-team container section">
        <div data-reveal>
          <Eyebrow>Люди за названием</Eyebrow>
          <h2>
            Ответственность,
            <br />
            <span>которую передают.</span>
          </h2>
        </div>
        <div data-reveal>
          <p className="lead">
            Это дело нашей семьи. Поэтому за названием «Адмирал» для нас стоят
            личные отношения и репутация.
          </p>
          <p>
            Мы разговариваем с владельцем, разбираемся в истории автомобиля и
            объясняем, что происходит. Не делаем вид, что все Mercedes
            одинаковые. И не начинаем ремонт без согласования.
          </p>
          <a href={telephone} className="text-link">
            Познакомиться по телефону
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <section className="section principles container">
        <Eyebrow>Наш подход</Eyebrow>
        <div className="principle-grid">
          {[
            [
              CarFront,
              "Только Mercedes",
              "Сосредоточены на одной марке и особенностях её автомобилей.",
            ],
            [
              ShieldCheck,
              "Сначала согласование",
              "Перечень и стоимость работ обсуждаем до начала ремонта.",
            ],
            [
              Wrench,
              "Внимание к причине",
              "Диагностика помогает выбрать решение, а не действовать наугад.",
            ],
          ].map(([Icon, title, description]) => {
            const I = Icon as typeof CarFront;
            return (
              <article key={String(title)} data-reveal>
                <I size={36} strokeWidth={1} />
                <h3>{String(title)}</h3>
                <p>{String(description)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <CTA />
    </>
  );
}
function Map() {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const points = branches
    .map((b, i) => `${b.coords.join(",")},pm2${i ? "gr" : "wt"}m${i + 1}`)
    .join("~");
  return (
    <div className="map-frame" ref={host}>
      {visible && (
        <iframe
          title="Карта Яндекса: два техцентра Адмирал в Москве"
          src={`https://yandex.ru/map-widget/v1/?ll=37.569%2C55.795&z=11&pt=${encodeURIComponent(points)}`}
          loading="lazy"
          allowFullScreen
        />
      )}
      <a
        className="map-fallback"
        href={`https://yandex.ru/maps/?pt=${encodeURIComponent(points)}&z=11`}
        target="_blank"
        rel="noreferrer"
      >
        Открыть обе точки в Яндекс Картах
        <ArrowUpRight size={17} />
      </a>
    </div>
  );
}
function ContactsPage() {
  return (
    <>
      <Intro
        eyebrow="Контакты"
        title="Будем рады знакомству."
        description="Выберите удобный техцентр. Перед визитом позвоните — поможем с записью и подскажем, как проехать."
      />
      <section className="container contact-section">
        <div className="contact-strip">
          <a href={telephone}>
            <Phone size={22} />
            {phone}
            <ArrowUpRight size={20} />
          </a>
          <span>
            <Clock3 size={20} />
            Ежедневно · 09:00–20:00
          </span>
        </div>
        <BranchCards />
        <Map />
        <p className="map-note">
          Метки показывают адреса зданий. Схему въезда в ремзону уточните по
          телефону.
        </p>
      </section>
      <CTA />
    </>
  );
}
function Privacy() {
  return (
    <>
      <Intro eyebrow="О персональных данных" title="Демонстрационная форма." />
      <section className="container legal-copy">
        <p>
          На этой версии сайта форма записи не отправляет и не сохраняет
          введённые данные. Проверка заполнения выполняется в вашем браузере.
          После закрытия формы данные очищаются.
        </p>
        <p>
          Для записи позвоните по номеру <a href={telephone}>{phone}</a>.
        </p>
        <p>
          В разделе контактов используется внешняя карта Яндекса. При её
          загрузке браузер обращается к сервису Яндекса, где действуют его
          условия обработки данных.
        </p>
        <a className="text-link" href="#/">
          На главную
          <ArrowRight size={18} />
        </a>
      </section>
    </>
  );
}
function BookingModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement | null);
  const [result, setResult] = useState(false);
  useEffect(() => {
    const previous = opener.current;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="booking-dialog"
      aria-labelledby="booking-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="booking-layout">
        <div className="booking-main">
          <button
            className="icon-button modal-close"
            aria-label="Закрыть форму"
            onClick={onClose}
          >
            <X />
          </button>
          <Eyebrow>Начнём с вашего Mercedes</Eyebrow>
          <h2 id="booking-title">
            Записаться
            <br />
            <span>в Адмирал.</span>
          </h2>
          <p className="demo-note">
            Демонстрация формы. Отправка заявок пока не подключена. Для записи
            позвоните нам.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setResult(true);
            }}
          >
            <label>
              Ваше имя
              <input
                name="name"
                autoComplete="given-name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Как к вам обращаться"
                onChange={() => setResult(false)}
              />
            </label>
            <label>
              Номер телефона
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                placeholder="+7 (___) ___-__-__"
                maxLength={22}
                onChange={(e) => {
                  const d = e.currentTarget.value.replace(/\D/g, "");
                  e.currentTarget.setCustomValidity(
                    d.length === 11 && /^[78]/.test(d)
                      ? ""
                      : "Введите номер из 11 цифр, начиная с +7 или 8.",
                  );
                  setResult(false);
                }}
              />
            </label>
            <div className="form-row">
              <label>
                Техцентр
                <select name="branch" defaultValue={booking.branch || "kiev"}>
                  {branches.map((b) => (
                    <option value={b.id} key={b.id}>
                      {b.name}
                      {b.new &&
                      new Date() < new Date("2026-11-15T00:00:00+03:00")
                        ? " · с 15 ноября"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Направление
                <select name="service" defaultValue={booking.service || ""}>
                  <option value="">Нужна консультация</option>
                  {allServices.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.short}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Автомобиль
              <input
                name="model"
                defaultValue={booking.model || ""}
                placeholder="Например, E-Класс W213"
                maxLength={100}
              />
            </label>
            <button className="button" type="submit">
              Проверить заполнение
              <ArrowRight size={19} />
            </button>
            <div aria-live="polite">
              {result && (
                <p className="form-result">
                  <Check size={20} />
                  Поля заполнены. Заявка не отправлена — для записи позвоните в
                  техцентр.
                </p>
              )}
            </div>
            <a className="booking-call" href={telephone}>
              <Phone size={18} />
              {phone}
            </a>
            <p className="form-privacy">
              Данные не отправляются и не сохраняются.{" "}
              <a href="#/privacy" onClick={onClose}>
                Подробнее
              </a>
            </p>
          </form>
        </div>
        <div className="booking-aside">
          <Image
            src={media.service}
            alt="Диагностика Mercedes-Benz в сервисе"
          />
          <div>
            <span>
              ONLY
              <br />
              MERCEDES.
            </span>
            <p>
              С 1999 года.
              <br />С вниманием к вашему автомобилю.
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}
function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  const [booking, setBooking] = useState<Booking | null>(null);
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    const change = () => setRoute(location.hash.slice(1) || "/");
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  const path = route.split("?")[0];
  const model =
    new URLSearchParams(route.split("?")[1] || "").get("model") || "";
  const service = allServices.find((s) => path === `/services/${s.id}`);
  useEffect(() => {
    document.title = `${service?.title || { "/": "Только Mercedes-Benz с 1999 года", "/services": "Услуги", "/about": "О нас", "/contacts": "Контакты", "/privacy": "О персональных данных" }[path] || "Страница не найдена"} — ТехЦентр Адмирал`;
    window.scrollTo({ top: 0, behavior: "instant" });
    setBooking(null);
    if (!first.current) main.current?.focus({ preventScroll: true });
    first.current = false;
  }, [route, path, service]);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils
          .toArray<HTMLElement>("[data-reveal]")
          .forEach((el) =>
            gsap.from(el, {
              opacity: 0,
              y: 32,
              duration: 0.85,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 94%", once: true },
            }),
          );
        gsap.utils
          .toArray<HTMLElement>(".timeline-item")
          .forEach((el) =>
            gsap.from(el, {
              "--line-progress": 0,
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                end: "bottom 60%",
                scrub: true,
              },
            }),
          );
      });
    }, main);
    const timer = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [path]);
  return (
    <BookContext.Provider value={(b) => setBooking(b || {})}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        К содержимому
      </a>
      <Header route={path} />
      <main ref={main} id="main" tabIndex={-1} key={path}>
        {path === "/" ? (
          <Home />
        ) : path === "/services" ? (
          <ServicesPage />
        ) : path === "/about" ? (
          <AboutPage />
        ) : path === "/contacts" ? (
          <ContactsPage />
        ) : path === "/privacy" ? (
          <Privacy />
        ) : service ? (
          <ServicePage service={service} model={model} />
        ) : (
          <>
            <Intro
              eyebrow="404"
              title="Эта дорога ведёт обратно."
              description="Страница не найдена. На главной есть всё, чтобы начать знакомство."
            />
            <div className="container section">
              <a className="button" href="#/">
                На главную
                <ArrowRight />
              </a>
            </div>
          </>
        )}
      </main>
      <Footer />
      {booking && (
        <BookingModal booking={booking} onClose={() => setBooking(null)} />
      )}
    </BookContext.Provider>
  );
}
const root =
  import.meta.hot?.data.root ?? createRoot(document.getElementById("root")!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

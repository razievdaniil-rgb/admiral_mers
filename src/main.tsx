import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  Plus,
  X,
  Menu,
  Phone,
  MapPin,
  ScanLine,
  Wrench,
  Cog,
  Disc3,
  Zap,
  CarFront,
  Settings2,
  Sparkles,
  Check,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./fonts.css";
import {
  allServices,
  branches,
  branchStatus,
  mapLink,
  phone,
  services,
  telephone,
  type Service,
} from "./data";
import { assetUrl, media } from "./assets";
import "./style.css";
import { FigmaHome, FigmaTimeline, ApproachCards } from "./figma-sections";
import "./figma.css";
import "./motion-polish.css";
import "./ux-refinement.css";
import "./xray-image.css";
import { SmoothScroll, scrollToSection } from "./smooth-scroll";
import { SmoothCatalog } from "./smooth-catalog";
import { CategoryModal } from "./category-modal";
import { serviceContent } from "./service-content";
import "./service-content.css";
import "./form-polish.css";
import "./premium-motion.css";
import { telegram, ContactLinks } from "./contact";
import { PriceList } from "./price-list";
import "./service-first.css";
import { MaintenanceCalculator } from "./maintenance-calculator";
import { ServiceUnitDetails } from "./service-unit-details";
import "./page-density.css";

gsap.registerPlugin(ScrollTrigger);
type Booking = { service?: string; model?: string; branch?: string };
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

function Logo({ since: _since = false }: { since?: boolean }) {
  return (
    <a
      href="#/"
      className="logo"
      aria-label="Адмирал — ремонт и обслуживание Mercedes-Benz с 1999 года. На главную"
    >
      <img
        src={assetUrl("media/admiral-wordmark.svg")}
        width="223"
        height="22"
        alt="Адмирал"
      />
      <span className="logo-descriptor">
        Ремонт и обслуживание Mercedes-Benz
        <br />с 1999 года
      </span>
    </a>
  );
}
function BookButton({
  children = "Написать в Telegram",
  booking,
  className = "",
}: {
  children?: React.ReactNode;
  booking?: Booking;
  className?: string;
}) {
  const context = [
    booking?.service &&
      allServices.find((s) => s.id === booking.service)?.short,
    booking?.model,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <a
      className={`button ${className}`}
      href={telegram}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={context ? `Написать в Telegram: ${context}` : undefined}
    >
      {children}
      <ArrowUpRight size={19} />
    </a>
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
      document.querySelector(".mobile-contact-dock"),
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
        <Logo since />
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
        <a
          className="mobile-call"
          href={telephone}
          aria-label="Позвонить в Адмирал"
        >
          <Phone size={19} />
        </a>
        <div className="header-book">
          <ContactLinks compact />
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
          <a href="#/maintenance-cost" onClick={() => setOpen(false)}>
            Рассчитать ТО <ArrowUpRight size={18} />
          </a>
          <ContactLinks compact />
          <p>Ремонт и обслуживание Mercedes-Benz с 1999 года.</p>
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
      <ContactLinks />
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
      <Eyebrow>Обсудим Ваш автомобиль</Eyebrow>
      <h2>
        Ваш Мерседес —<br />
        <span>наша ответственность</span>
      </h2>
      <div className="cta-bottom">
        <p>
          Расскажите, что беспокоит автомобиль.
          <br />
          Вместе определим следующий шаг.
        </p>
        <ContactLinks compact />
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
          <h3>{b.name}</h3>
          <p>{b.address.replace("Москва, ", "")}</p>
          <div className="branch-actions">
            <a href={mapLink(b.address)} target="_blank" rel="noreferrer">
              Маршрут
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
  const service = services.find((s) => s.id === active);
  return (
    <>
      <div className={`service-grid ${compact ? "compact" : ""}`}>
        {services.map((s, i) => (
          <article className="service-card" key={s.id} data-reveal>
            <button
              className="service-toggle"
              aria-haspopup="dialog"
              onClick={() => setActive(s.id)}
            >
              <Image
                src={media.serviceIllustrations[i]}
                alt=""
                className="service-illustration"
              />
              <span>{s.short}</span>
              <Plus className="service-plus" size={18} />
            </button>
          </article>
        ))}
      </div>
      {service && (
        <CategoryModal
          service={service}
          model={selectedModel}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
function Timeline() {
  return <FigmaTimeline />;
}
function Home() {
  return <FigmaHome />;
}
function Catalog() {
  return (
    <SmoothCatalog
      renderServices={(model) => <ServiceGrid selectedModel={model} />}
    />
  );
}
function ServicesPage() {
  const shortcutLabels: Record<string, string> = {
    maintenance: "ТО",
    diagnostics: "Диагностика",
    engine: "Двигатель",
    transmission: "КПП и привод",
    suspension: "Ходовая",
    electrics: "Электрика",
    body: "Кузов",
    retrofit: "Дооснащение",
    detailing: "Детейлинг",
  };
  const catalog = useRef<HTMLElement>(null);
  const showCatalog = () => {
    if (!catalog.current) return;
    scrollToSection(catalog.current);
    catalog.current.querySelector("select")?.focus({ preventScroll: true });
  };
  return (
    <>
      <Intro
        eyebrow="Услуги"
        title="Услуги для Вашего Mercedes"
        description="ТО, диагностика, ремонт агрегатов, кузов и детейлинг. Найдите нужную работу или свяжитесь с нами напрямую."
      />
      <nav
        className="container service-shortcuts"
        aria-label="Быстрый выбор направления"
      >
        <button
          className="catalog-shortcut"
          onClick={showCatalog}
          aria-controls="mercedes-catalog"
        >
          <CarFront size={17} />
          Выбрать Mercedes
          <ArrowUpRight size={14} />
        </button>
        {allServices.map((s) => (
          <a
            href={`#/services/${s.id}`}
            key={s.id}
            aria-label={s.short}
            title={s.short}
          >
            {shortcutLabels[s.id] || s.short}
            <ArrowUpRight size={13} />
          </a>
        ))}
      </nav>
      <PriceList />
      <section className="container section direct-directions">
        <div className="price-section-heading">
          <div>
            <p className="eyebrow">От ТО до кузовного ремонта</p>
            <h2>Все направления</h2>
          </div>
        </div>
        <ServiceGrid />
      </section>
      <section className="container section supported-models">
        <p className="eyebrow">Только Mercedes-Benz. Любого поколения.</p>
        <h2>От W140 и SL до современных моделей</h2>
        <p>
          Обслуживаем и классические, и новые Mercedes-Benz. Если Вашего кузова
          нет на витрине, это не ограничивает запись в сервис.
        </p>
      </section>
      <section className="optional-catalog" ref={catalog} id="mercedes-catalog">
        <div className="container catalog-section-heading">
          Модели Mercedes-Benz
        </div>
        <Catalog />
      </section>
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
  const content = serviceContent[service.id];
  return (
    <>
      <Intro
        eyebrow="Услуги"
        title={service.title}
        description={service.intro}
      />
      <section className="service-detail container">
        <div className="service-photo" data-reveal>
          <Image src={service.image} alt={service.imageAlt} eager />
          <span>
            <Icon size={26} />
            {service.short}
          </span>
        </div>
        <div className="service-detail-copy" data-reveal>
          <h1>{service.title}</h1>
          <p className="service-detail-intro">{service.intro}</p>
          {model && (
            <p className="selected-model">
              <CarFront size={18} />
              {model}
            </p>
          )}
          <div className="service-detail-actions">
            <BookButton booking={{ service: service.id, model }}>
              Обсудить{" "}
              {service.id === "maintenance" ? "обслуживание" : "работы"}
            </BookButton>
            {service.id === "maintenance" && (
              <a className="button secondary" href="#/maintenance-cost">
                Рассчитать ТО <ArrowUpRight size={18} />
              </a>
            )}
            {service.id === "engine" && (
              <div className="service-related-links">
                <a href="#/services/transmission">
                  КПП, РКПП, раздатка и редукторы ↗
                </a>
              </div>
            )}
          </div>
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
            ремонта, о котором Вы не договаривались.
          </p>
          <a className="back-link" href="#/services">
            <ChevronLeft size={17} />К списку услуг
          </a>
        </div>
      </section>
      <PriceList service={service.id} />
      <ServiceUnitDetails service={service.id} />
      {content && (
        <section
          className="service-guidance container section"
          aria-label="Подробнее об услуге"
        >
          <div data-reveal>
            <Eyebrow>Когда обратиться</Eyebrow>
            <h2>Знакомая ситуация?</h2>
            <ul className="service-symptoms">
              {content.symptoms.map((symptom, index) => (
                <li key={symptom}>
                  <span aria-hidden="true">0{index + 1}</span>
                  {symptom}
                </li>
              ))}
            </ul>
          </div>
          <div className="service-guidance-copy" data-reveal>
            <Eyebrow>От обращения к решению</Eyebrow>
            <h2>Сначала разбираемся в задаче</h2>
            <p>{content.explanation}</p>
            <h3>Перед визитом</h3>
            <p>{content.preparation}</p>
            <a className="text-link" href={telephone}>
              Обсудить с техцентром <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
      )}
      <section className="process container section">
        <Eyebrow>Понятный порядок</Eyebrow>
        <div>
          {[
            [
              "01",
              "Обсуждаем задачу",
              "Уточняем модель, историю и Ваши наблюдения.",
            ],
            [
              "02",
              "Проверяем и согласуем",
              "Определяем объём работ, обсуждаем стоимость и сроки.",
            ],
            [
              "03",
              "Выполняем работы",
              "Работаем по согласованному перечню и проверяем результат.",
            ],
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
    <div className="figma-about">
      <Intro
        eyebrow="О нас"
        title="О НАС"
        description="Профильный сервис Mercedes-Benz с 1999 года. Наш путь, команда и подход к работе."
      />
      <section className="container about-history-section">
        <Timeline />
      </section>
      <section className="about-team container section">
        <div>
          <h2>КОМАНДА</h2>
          <Image src={media.service} alt="Работа с автомобилем Mercedes-Benz" />
        </div>
        <div>
          <h3>
            Знаем Mercedes.
            <br />
            Слышим владельца.
          </h3>
          <p className="lead">
            За названием «Адмирал» — специалисты, которые занимаются
            Mercedes-Benz с 1999 года. Наша работа строится на опыте, внимании к
            автомобилю и открытом общении.
          </p>
          <p>
            Разбираемся в истории автомобиля, объясняем результаты диагностики и
            согласовываем работы до начала ремонта.
          </p>
          <a href={telephone} className="text-link">
            Обсудить по телефону
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <section className="section principles container">
        <div className="figma-centered-heading">
          <h2>НАШ ПОДХОД</h2>
        </div>
        <ApproachCards />
      </section>
      <CTA />
    </div>
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
        title="Два техцентра в Москве"
        description="Выберите удобный техцентр. Перед визитом позвоните — поможем с записью и подскажем, как проехать."
      />
      <section className="container contact-section">
        <ContactLinks />
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
      <Intro eyebrow="О персональных данных" title="Связь с техцентром" />
      <section className="container legal-copy">
        <p>
          На сайте нет формы сбора заявок. Для общения Вы можете позвонить или
          перейти в Telegram и WhatsApp. Переписка происходит в выбранном Вами
          сервисе на его условиях.
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
function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
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
    document.title = `${service?.title || { "/": "Только Mercedes-Benz с 1999 года", "/services": "Услуги", "/maintenance-cost": "Рассчитать ТО", "/about": "О нас", "/contacts": "Контакты", "/privacy": "О персональных данных" }[path] || "Страница не найдена"} — ТехЦентр Адмирал`;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!first.current) main.current?.focus({ preventScroll: true });
    first.current = false;
  }, [route, path, service]);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
          gsap.from(el, {
            opacity: el.getBoundingClientRect().top < innerHeight ? 1 : 0,
            y: 10,
            duration: 0.65,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 94%", once: true },
          }),
        );
        gsap.utils.toArray<HTMLElement>(".timeline-item").forEach((el) =>
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
    <>
      <SmoothScroll />
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
        ) : path === "/maintenance-cost" ? (
          <MaintenanceCalculator />
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
              description="Страница не найдена. Откройте главную или раздел услуг."
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
      <div className="mobile-contact-dock">
        <ContactLinks compact />
      </div>
    </>
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

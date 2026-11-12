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
  models,
  phone,
  services,
  telephone,
  type Service,
} from "./data";
import { assetUrl, media } from "./assets";
import "./style.css";
import { FigmaHome, FigmaTimeline, ApproachCards } from "./figma-sections";
import "./figma.css";
import { VehicleInspector } from "./vehicle-inspector";
import { CategoryModal } from "./category-modal";

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
  const book = useBook();
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
          onBook={() => book({ service: service.id, model: selectedModel })}
        />
      )}
    </>
  );
}
function Timeline() {
  return <FigmaTimeline />;
}
function Home() {
  const book = useBook();
  return <FigmaHome onBook={book} />;
}
function InteractiveVehicle({ src, model }: { src: string; model: string }) {
  return <VehicleInspector src={src} model={model} />;
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
          <div className="model-side-previews">
            {["s", "e", "gle"]
              .filter((id) => id !== modelId)
              .slice(0, 2)
              .map((id, i) => {
                const m = models.find((x) => x.id === id)!;
                const g = m.generations.find(
                  (x) => media.models[`${id}-${x}`],
                )!;
                return (
                  <button
                    key={id}
                    className={`model-side-preview ${i === 0 ? "left" : "right"}`}
                    onClick={() => select(id)}
                    aria-label={`Выбрать ${m.name} ${g}`}
                  >
                    <span>
                      {m.name} {g.replace(/\s*\([^)]*\)/g, "")}
                    </span>
                    <Image src={media.models[`${id}-${g}`]} alt="" />
                  </button>
                );
              })}
          </div>
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
        title="Услуги"
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
          <h1>{service.title}</h1>
          <p className="service-detail-intro">{service.intro}</p>
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
            Познакомиться по телефону
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
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
          gsap.from(el, {
            opacity: 0,
            y: 32,
            duration: 0.85,
            ease: "power2.out",
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

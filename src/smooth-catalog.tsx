import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { assetUrl, media } from "./assets";
import { models, services } from "./data";
import { VehicleInspector } from "./vehicle-inspector";
const showcase = [
  { id: "e", generation: "W213" },
  { id: "s", generation: "W222" },
  { id: "gle", generation: "W166 (ML / GLE)" },
].map((item) => ({
  ...item,
  name: models.find((m) => m.id === item.id)!.name,
  image: media.models[`${item.id}-${item.generation}`],
}));
export function SmoothCatalog({
  onBook,
  renderServices,
}: {
  onBook: (b: { model: string }) => void;
  renderServices: (model: string) => ReactNode;
}) {
  const pickerId = useId();
  const [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [activeNode, setActiveNode] = useState<string | null>(null),
    [otherId, setOtherId] = useState("b"),
    [otherGeneration, setOtherGeneration] = useState("W247");
  const stage = useRef<HTMLDivElement>(null),
    slides = useRef<(HTMLDivElement | null)[]>([]),
    previous = useRef(0),
    watchdog = useRef<ReturnType<typeof setTimeout> | null>(null),
    motion = useRef<gsap.core.Timeline | null>(null),
    direction = useRef(1),
    initialized = useRef(false),
    locked = useRef(false),
    touch = useRef<{ x: number; y: number } | null>(null);
  const selectedService = services.find((s) => s.id === activeNode);
  const selected = showcase[index],
    other = models.find((m) => m.id === otherId)!;
  const label = `${selected.name} ${selected.generation.replace(/\s*\([^)]*\)/g, "")}`;
  const select = (next: number) => {
    next = (next + showcase.length) % showcase.length;
    if (next === index || locked.current) return;
    direction.current = next === (index + 1) % showcase.length ? 1 : -1;
    previous.current = index;
    locked.current = true;
    setBusy(true);
    setIndex(next);
  };
  useLayoutEffect(() => {
    const panels = slides.current;
    if (!initialized.current) {
      initialized.current = true;
      panels.forEach((panel, i) =>
        gsap.set(panel, {
          xPercent: i === index ? 0 : 110,
          autoAlpha: i === index ? 1 : 0,
        }),
      );
      return;
    }
    if (previous.current === index) return;
    motion.current?.kill();
    const incoming = panels[index],
      outgoing = panels[previous.current];
    const finish = () => {
      if (watchdog.current) clearTimeout(watchdog.current);
      gsap.set(outgoing, { autoAlpha: 0 });
      gsap.set(incoming, { xPercent: 0, scale: 1, rotationY: 0, autoAlpha: 1 });
      locked.current = false;
      setBusy(false);
    };
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
      finish();
      return;
    }
    const d = direction.current;
    // Both real vehicles share the stage throughout the change, like a garage selector.
    gsap.set(incoming, {
      xPercent: d * 110,
      scale: 0.9,
      rotationY: d * -7,
      autoAlpha: 1,
      zIndex: 2,
    });
    gsap.set(outgoing, { zIndex: 1 });
    watchdog.current = setTimeout(() => {
      if (locked.current) {
        motion.current?.kill();
        finish();
      }
    }, 1500);
    motion.current = gsap
      .timeline({ onComplete: finish })
      .to(
        outgoing,
        {
          xPercent: d * -110,
          scale: 0.9,
          rotationY: d * 7,
          duration: 1.15,
          ease: "power3.inOut",
        },
        0,
      )
      .to(
        incoming,
        {
          xPercent: 0,
          scale: 1,
          rotationY: 0,
          duration: 1.15,
          ease: "power3.inOut",
        },
        0,
      );
  }, [index]);
  useEffect(() => {
    showcase.forEach((x) => {
      const image = new Image();
      image.src = assetUrl(x.image);
    });
    return () => {
      motion.current?.kill();
      if (watchdog.current) clearTimeout(watchdog.current);
    };
  }, []);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
        e.preventDefault();
        select(index + (e.deltaX > 0 ? 1 : -1));
      }
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [index]);
  return (
    <>
      <section className="garage container">
        <div
          className="garage-models"
          role="group"
          aria-label="Выбор автомобиля"
        >
          {showcase.map((m, i) => (
            <button
              key={m.id}
              aria-pressed={index === i}
              disabled={busy}
              onClick={() => select(i)}
            >
              {m.name}
              <span>{m.generation.replace(/\s*\([^)]*\)/g, "")}</span>
            </button>
          ))}
        </div>
        <div
          ref={stage}
          className="garage-stage"
          role="group"
          tabIndex={0}
          aria-label="Витрина моделей. Стрелки влево и вправо переключают классы."
          aria-busy={busy}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              select(index + (e.key === "ArrowRight" ? 1 : -1));
            }
          }}
          onTouchStart={(e) => {
            if ((e.target as HTMLElement).closest(".zoomed,button,select"))
              return;
            touch.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          }}
          onTouchEnd={(e) => {
            if (!touch.current) return;
            const dx = e.changedTouches[0].clientX - touch.current.x,
              dy = e.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
              e.preventDefault();
              select(index + (dx < 0 ? 1 : -1));
            }
            touch.current = null;
          }}
        >
          <button
            className="garage-arrow prev-model"
            aria-label="Предыдущий класс"
            disabled={busy}
            onClick={() => select(index - 1)}
          >
            <ChevronLeft />
          </button>
          <div className="garage-track">
            {showcase.map((vehicle, i) => (
              <div
                className="garage-slide"
                key={vehicle.id}
                ref={(el) => {
                  slides.current[i] = el;
                }}
                aria-hidden={i !== index}
                inert={i !== index || busy}
              >
                <div className="garage-model-title">
                  <h2>
                    {vehicle.name}
                    <small>{vehicle.generation}</small>
                  </h2>
                </div>
                <div className="garage-vehicle">
                  <VehicleInspector
                    src={vehicle.image}
                    active={activeNode}
                    onSelect={setActiveNode}
                    isActive={i === index}
                    model={
                      vehicle.name +
                      " " +
                      vehicle.generation.replace(/\s*\([^)]*\)/g, "")
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <span className="sr-only" role="status">
            {label}
          </span>
          <button
            className="garage-arrow next-model"
            aria-label="Следующий класс"
            disabled={busy}
            onClick={() => select(index + 1)}
          >
            <ChevronRight />
          </button>
        </div>
        <div className="garage-work-panel">
          <div
            className="garage-work-options"
            role="group"
            aria-label="Узлы автомобиля"
          >
            {[
              ["diagnostics", "Диагностика"],
              ["engine", "Двигатель"],
              ["suspension", "Ходовая"],
              ["electrics", "Электрика"],
            ].map(([id, title]) => (
              <button
                key={id}
                aria-pressed={activeNode === id}
                onClick={() => setActiveNode(activeNode === id ? null : id)}
              >
                {title}
              </button>
            ))}
          </div>
          {selectedService && (
            <div className="garage-selected-work" aria-live="polite">
              <div>
                <h3>{selectedService.short}</h3>
                <p>{selectedService.works.slice(0, 2).join(" · ")}</p>
              </div>
              <a
                className="text-link"
                href={`#/services/${selectedService.id}?model=${encodeURIComponent(label)}`}
              >
                Смотреть работы
                <ArrowUpRight size={17} />
              </a>
            </div>
          )}
          <div className="garage-actions">
            <p>
              {selectedService
                ? "Выбранный автомобиль"
                : "Выберите узел на машине или направление выше"}
              <span>{label}</span>
            </p>
            <button className="button" onClick={() => onBook({ model: label })}>
              Записаться
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
        <details className="all-models-picker">
          <summary>
            У меня другая модель
            <span>
              Выбрать класс и кузов <ChevronRight size={16} />
            </span>
          </summary>
          <p>Обслуживаем весь модельный ряд. Укажите автомобиль для записи.</p>
          <div>
            <label htmlFor={`${pickerId}-model`}>
              Ваш Mercedes
              <select
                id={`${pickerId}-model`}
                value={otherId}
                onChange={(e) => {
                  const m = models.find((x) => x.id === e.target.value)!;
                  setOtherId(m.id);
                  setOtherGeneration(m.generations.at(-1)!);
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${pickerId}-generation`}>
              Поколение / кузов
              <select
                id={`${pickerId}-generation`}
                value={otherGeneration}
                onChange={(e) => setOtherGeneration(e.target.value)}
              >
                {other.generations.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <button
              className="button"
              onClick={() =>
                onBook({ model: `${other.name} ${otherGeneration}` })
              }
            >
              Записаться: {other.name}
              <ArrowUpRight size={17} />
            </button>
          </div>
        </details>
      </section>
      <section
        className="container catalog-services section"
        id="catalog-services"
      >
        <div className="section-heading">
          <h2>Все направления работ</h2>
          <p>
            Выберите направление. Точный перечень работ согласуем после осмотра.
          </p>
        </div>
        {renderServices(label)}
      </section>
    </>
  );
}

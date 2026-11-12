import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { assetUrl, media } from "./assets";
import { models } from "./data";
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
  const [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [otherId, setOtherId] = useState("b"),
    [otherGeneration, setOtherGeneration] = useState("W247");
  const stage = useRef<HTMLDivElement>(null),
    slides = useRef<(HTMLDivElement | null)[]>([]),
    previous = useRef(0),
    motion = useRef<gsap.core.Timeline | null>(null),
    direction = useRef(1),
    initialized = useRef(false),
    locked = useRef(false),
    touch = useRef<{ x: number; y: number } | null>(null);
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
      )
      .fromTo(
        incoming?.querySelectorAll(
          ".inspector-views,.inspector-tools,.node-panel",
        ) || [],
        { opacity: 0 },
        { opacity: 1, duration: 0.35 },
        0.8,
      );
  }, [index]);
  useEffect(() => {
    showcase.forEach((x) => {
      const image = new Image();
      image.src = assetUrl(x.image);
    });
    return () => {
      motion.current?.kill();
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
      <section className="catalog container smooth-catalog">
        <div className="catalog-toolbar">
          <label>
            Модель в обзоре
            <select
              value={selected.id}
              disabled={busy}
              onChange={(e) =>
                select(showcase.findIndex((m) => m.id === e.target.value))
              }
            >
              {showcase.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.generation.replace(/\s*\([^)]*\)/g, "")}
                </option>
              ))}
            </select>
          </label>
          <span className="showcase-counter">
            {index + 1} / {showcase.length}
          </span>
        </div>
        <div
          className="model-presets"
          aria-label="Модели с интерактивной схемой"
        >
          {showcase.map((m, i) => (
            <button
              key={m.id}
              className={index === i ? "active" : ""}
              disabled={busy}
              onClick={() => select(i)}
            >
              {m.name} {m.generation.replace(/\s*\([^)]*\)/g, "")}
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
        <div
          ref={stage}
          className="model-stage"
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
            className="icon-button prev-model"
            aria-label="Предыдущий класс"
            disabled={busy}
            onClick={() => select(index - 1)}
          >
            <ChevronLeft />
          </button>
          <div className="model-side-previews">
            {[-1, 1].map((delta) => {
              const i = (index + delta + showcase.length) % showcase.length,
                m = showcase[i];
              return (
                <button
                  key={delta}
                  className={`model-side-preview ${delta < 0 ? "left" : "right"}`}
                  disabled={busy}
                  onClick={() => select(i)}
                  aria-label={`Выбрать ${m.name} ${m.generation}`}
                >
                  <span>
                    {m.name} {m.generation.replace(/\s*\([^)]*\)/g, "")}
                  </span>
                  <img src={assetUrl(m.image)} alt="" />
                </button>
              );
            })}
          </div>
          <div className="catalog-track">
            {showcase.map((vehicle, i) => (
              <div
                className="catalog-slide"
                key={vehicle.id}
                ref={(el) => {
                  slides.current[i] = el;
                }}
                aria-hidden={i !== index}
                inert={i !== index || busy}
              >
                <div className="model-head">
                  <h1>
                    {vehicle.name}
                    <small>{vehicle.generation}</small>
                  </h1>
                </div>
                <div className="model-image">
                  <VehicleInspector
                    src={vehicle.image}
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
            className="icon-button next-model"
            aria-label="Следующий класс"
            disabled={busy}
            onClick={() => select(index + 1)}
          >
            <ChevronRight />
          </button>
          <div className="model-stage-footer">
            <button className="button" onClick={() => onBook({ model: label })}>
              Обсудить автомобиль
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
        <details className="all-models-picker">
          <summary>
            Другой класс или поколение Mercedes-Benz?<span>Все модели</span>
          </summary>
          <p>Выберите свой автомобиль — обсудим работы для его поколения.</p>
          <div>
            <label>
              Ваш Mercedes
              <select
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
            <label>
              Поколение / кузов
              <select
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
              Обсудить {other.name}
              <ArrowUpRight size={17} />
            </button>
          </div>
        </details>
      </section>
      <section className="container catalog-services section">
        <div className="section-heading">
          <h2>Услуги для вашего Mercedes</h2>
          <p>
            Выберите направление. Точный перечень работ согласуем после осмотра.
          </p>
        </div>
        {renderServices(label)}
      </section>
    </>
  );
}

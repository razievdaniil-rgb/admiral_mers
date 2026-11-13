import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { models, services } from "./data";
import { vehicleLabel } from "./vehicle-library";
import vehicles from "./catalog-vehicles.json";
import { assetUrl } from "./assets";
import "./catalog-2d.css";
export function SmoothCatalog({
  onBook,
  renderServices,
}: {
  onBook: (b: { model: string; service?: string }) => void;
  renderServices: (model: string) => ReactNode;
}) {
  const pickerId = useId();
  const [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [activeNode, setActiveNode] = useState<string | null>(null),
    [otherId, setOtherId] = useState("b"),
    [otherGeneration, setOtherGeneration] = useState("W247");
  const touch = useRef<{ x: number; y: number } | null>(null);
  const selected = vehicles[index],
    label = vehicleLabel(selected),
    other = models.find((m) => m.id === otherId)!,
    selectedService = services.find((s) => s.id === activeNode);
  const [previous, setPrevious] = useState<number | null>(null),
    [direction, setDirection] = useState(1);
  const transition = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const mounted = useRef(true);
  const locked = useRef(false);
  const queued = useRef<{ next: number; direction: number } | null>(null);
  const desired = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(transition.current);
    };
  }, []);
  useEffect(() => {
    for (const offset of [-1, 1]) {
      const image = new Image();
      image.src = assetUrl(
        vehicles[(index + offset + vehicles.length) % vehicles.length].image,
      );
    }
  }, [index]);
  useEffect(() => {
    if (!busy && queued.current !== null) {
      const next = queued.current;
      queued.current = null;
      void select(next.next, next.direction);
    }
  }, [busy]);
  const select = async (next: number, requestedDirection?: number) => {
    const direction = requestedDirection ?? (next < desired.current ? -1 : 1);
    desired.current = next;
    if (locked.current) {
      queued.current = { next, direction };
      return;
    }
    next = ((next % vehicles.length) + vehicles.length) % vehicles.length;
    if (next === index) return;
    locked.current = true;
    setBusy(true);
    const image = new Image();
    image.src = assetUrl(vehicles[next].image);
    try {
      await image.decode();
    } catch {
      locked.current = false;
      if (mounted.current) setBusy(false);
      return;
    }
    if (!mounted.current) return;
    setDirection(direction);
    setPrevious(index);
    setIndex(next);
    clearTimeout(transition.current);
    transition.current = setTimeout(
      () => {
        setPrevious(null);
        locked.current = false;
        setBusy(false);
      },
      matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 860,
    );
    setActiveNode(null);
  };
  return (
    <>
      <section className="garage container">
        <div className="catalog-heading">
          <div aria-live="polite">
            <h2>{selected.name}</h2>
            <p>{selected.generation}</p>
          </div>
          <label
            className="catalog-model-picker"
            htmlFor={pickerId + "-showcase"}
          >
            <span>Выбрать модель</span>
            <select
              id={pickerId + "-showcase"}
              aria-label="Выбрать модель"
              value={index}
              onChange={(e) => void select(Number(e.target.value))}
            >
              {vehicles.map((v, i) => (
                <option key={v.id} value={i}>
                  {v.name} · {v.generation}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="catalog-stage"
          role="group"
          tabIndex={0}
          aria-label="Витрина Mercedes-Benz. Стрелки влево и вправо переключают автомобили."
          aria-busy={busy}
          style={{ "--slide-direction": direction } as React.CSSProperties}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              void select(desired.current + (e.key === "ArrowRight" ? 1 : -1));
            }
          }}
          onTouchStart={(e) => {
            if ((e.target as HTMLElement).closest("button,select")) return;
            touch.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          }}
          onTouchEnd={(e) => {
            if (!touch.current) return;
            const dx = e.changedTouches[0].clientX - touch.current.x,
              dy = e.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy))
              void select(desired.current + (dx < 0 ? 1 : -1));
            touch.current = null;
          }}
        >
          {previous !== null && (
            <img
              key={"out-" + previous}
              className="catalog-car catalog-car-out"
              src={assetUrl(vehicles[previous].image)}
              alt=""
              aria-hidden="true"
              width="900"
              height="500"
            />
          )}
          <img
            key={selected.id}
            className={
              "catalog-car " + (previous !== null ? "catalog-car-in" : "")
            }
            src={assetUrl(selected.image)}
            alt={
              selected.name.startsWith("Mercedes")
                ? label
                : "Mercedes-Benz " + label
            }
            width="900"
            height="500"
            fetchPriority="high"
            draggable={false}
          />
          <button
            className="catalog-arrow catalog-arrow-prev"
            aria-label="Предыдущий автомобиль"
            onClick={() => void select(desired.current - 1)}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            className="catalog-arrow catalog-arrow-next"
            aria-label="Следующий автомобиль"
            onClick={() => void select(desired.current + 1)}
          >
            <ChevronRight size={24} />
          </button>
          <span className="catalog-counter">
            {index + 1} / {vehicles.length}
          </span>
        </div>
        <div className="garage-work-panel">
          <div
            className="garage-work-options"
            role="group"
            aria-label="Направления работ"
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
                : "Выберите направление работ выше"}
              <span>{label}</span>
            </p>
            <button
              className="button"
              onClick={() =>
                onBook({ model: label, service: activeNode || undefined })
              }
            >
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
                onBook({
                  model: `${other.name} ${otherGeneration}`,
                  service: activeNode || undefined,
                })
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

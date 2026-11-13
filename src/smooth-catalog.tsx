import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { models, services } from "./data";
import { vehicles, vehicleLabel } from "./vehicle-library";
import { Vehicle3D } from "./vehicle-3d";
export function SmoothCatalog({
  onBook,
  renderServices,
}: {
  onBook: (b: { model: string }) => void;
  renderServices: (model: string) => ReactNode;
}) {
  const pickerId = useId();
  const [index, setIndex] = useState(0),
    [busy, setBusy] = useState(true),
    [activeNode, setActiveNode] = useState<string | null>(null),
    [otherId, setOtherId] = useState("b"),
    [otherGeneration, setOtherGeneration] = useState("W247");
  const touch = useRef<{ x: number; y: number } | null>(null);
  const selected = vehicles[index],
    label = vehicleLabel(selected),
    other = models.find((m) => m.id === otherId)!,
    selectedService = services.find((s) => s.id === activeNode);
  const select = (next: number) => {
    if (busy) return;
    next = (next + vehicles.length) % vehicles.length;
    if (next === index) return;
    setBusy(true);
    setIndex(next);
    setActiveNode(null);
  };
  return (
    <>
      <section className="garage container">
        <div
          className="garage-models"
          role="group"
          aria-label="Выбор автомобиля"
        >
          {vehicles.map((m, i) => (
            <button
              key={m.id}
              aria-pressed={index === i}
              disabled={busy}
              onClick={() => select(i)}
            >
              {m.name}
              <span>{m.generation}</span>
            </button>
          ))}
        </div>
        <div className="garage-3d-heading">
          <div className="garage-3d-title" aria-live="polite">
            <h2>{selected.name}</h2>
            <p>{selected.generation}</p>
          </div>
          <div className="garage-3d-navigation">
            <button
              aria-label="Предыдущий класс"
              disabled={busy}
              onClick={() => select(index - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            <span>
              {index + 1} / {vehicles.length}
            </span>
            <button
              aria-label="Следующий класс"
              disabled={busy}
              onClick={() => select(index + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div
          className="garage-stage garage-stage-3d"
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
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
              select(index + (dx < 0 ? 1 : -1));
            }
            touch.current = null;
          }}
        >
          <Vehicle3D
            vehicle={selected}
            onStatusChange={(state) => setBusy(state === "loading")}
          />
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
                : "Выберите направление работ выше"}
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

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Minus,
  RotateCcw,
  Play,
  Pause,
  Move,
} from "lucide-react";
import { assetUrl } from "./assets";
import { services } from "./data";
const points = [
  { id: "engine", label: "Двигатель", x: 29, y: 43 },
  { id: "suspension", label: "Ходовая и тормоза", x: 23, y: 70 },
  { id: "electrics", label: "Электрика", x: 51, y: 33 },
  { id: "diagnostics", label: "Диагностика", x: 74, y: 60 },
];
export function VehicleInspector({
  src,
  model,
}: {
  src: string;
  model: string;
}) {
  const [active, setActive] = useState<string | null>(null),
    [view, setView] = useState("all"),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [tour, setTour] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const choose = (id: string) => {
    setView(id);
    setZoom(id === "all" ? 1 : 1.7);
    setPan({ x: 0, y: 0 });
  };
  useEffect(() => {
    if (zoom === 1) {
      setPan({ x: 0, y: 0 });
      setView("all");
    }
  }, [zoom]);
  useEffect(() => {
    if (!tour) return;
    let index = 0;
    setActive(points[0].id);
    choose("front");
    const timer = setInterval(() => {
      index++;
      if (index === points.length) {
        setTour(false);
        choose("all");
        clearInterval(timer);
        return;
      }
      setActive(points[index].id);
      choose(index === 3 ? "rear" : index === 2 ? "all" : "front");
    }, 2600);
    return () => clearInterval(timer);
  }, [tour]);
  const service = services.find((s) => s.id === active);
  return (
    <div className="interactive-vehicle inspector">
      <div className="inspector-views" aria-label="Область осмотра">
        {[
          ["all", "Весь автомобиль"],
          ["front", "Передняя часть"],
          ["rear", "Задняя часть"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            onClick={() => {
              setTour(false);
              choose(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={`inspector-viewport ${zoom > 1 ? "zoomed" : ""}`}
        tabIndex={0}
        role="group"
        aria-label="Изображение автомобиля. Плюс и минус меняют масштаб, стрелки перемещают увеличенное изображение."
        style={{ touchAction: zoom > 1 ? "none" : "pan-y" }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            setZoom((z) => Math.min(2.4, z + 0.2));
          } else if (e.key === "-") {
            e.preventDefault();
            setZoom((z) => Math.max(1, z - 0.2));
          } else if (
            zoom > 1 &&
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
          ) {
            e.preventDefault();
            setPan((p) => ({
              x: Math.max(
                -120,
                Math.min(
                  120,
                  p.x +
                    (e.key === "ArrowLeft"
                      ? 15
                      : e.key === "ArrowRight"
                        ? -15
                        : 0),
                ),
              ),
              y: Math.max(
                -45,
                Math.min(
                  45,
                  p.y +
                    (e.key === "ArrowUp"
                      ? 10
                      : e.key === "ArrowDown"
                        ? -10
                        : 0),
                ),
              ),
            }));
          }
        }}
        onPointerDown={(e) => {
          if (zoom <= 1 || (e.target as HTMLElement).closest("button")) return;
          setTour(false);
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const max = e.currentTarget.clientWidth * 0.22;
          setPan({
            x: Math.max(
              -max,
              Math.min(max, drag.current.px + e.clientX - drag.current.x),
            ),
            y: Math.max(
              -45,
              Math.min(45, drag.current.py + e.clientY - drag.current.y),
            ),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onLostPointerCapture={() => (drag.current = null)}
      >
        <div
          className={`vehicle-frame inspector-plane ${drag.current ? "dragging" : ""}`}
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
            transformOrigin:
              view === "front"
                ? "25% 55%"
                : view === "rear"
                  ? "78% 55%"
                  : "50% 55%",
          }}
        >
          <img
            src={assetUrl(src)}
            alt={`Mercedes-Benz ${model}`}
            draggable={false}
          />
          {points.map((p) => (
            <button
              key={p.id}
              className={`hotspot ${active === p.id ? "active" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              aria-label={`Узел: ${p.label}`}
              aria-expanded={active === p.id}
              aria-controls="vehicle-node-panel"
              onClick={() => {
                setTour(false);
                setActive(active === p.id ? null : p.id);
              }}
            >
              <Plus size={14} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="inspector-tools">
        <span>
          <Move size={13} />
          {zoom > 1
            ? "Перетащите, чтобы рассмотреть"
            : "Выберите узел автомобиля"}
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="Уменьшить автомобиль"
            disabled={zoom <= 1}
            onClick={() => {
              setTour(false);
              setZoom((z) => Math.max(1, z - 0.2));
            }}
          >
            <Minus size={15} />
          </button>
          <output aria-label="Масштаб">{Math.round(zoom * 100)}%</output>
          <button
            className="icon-button"
            aria-label="Увеличить автомобиль"
            disabled={zoom >= 2.4}
            onClick={() => {
              setTour(false);
              setZoom((z) => Math.min(2.4, z + 0.2));
            }}
          >
            <Plus size={15} />
          </button>
          <button
            className="icon-button"
            aria-label="Сбросить осмотр"
            onClick={() => {
              setTour(false);
              setActive(null);
              choose("all");
            }}
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="tour-button"
            aria-pressed={tour}
            onClick={() => setTour(!tour)}
          >
            {tour ? <Pause size={14} /> : <Play size={14} />}
            <span>{tour ? "Остановить" : "Автообзор"}</span>
          </button>
        </div>
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
            Нажмите на двигатель, колесо или другой узел — покажем работы по
            нему.
          </p>
        )}
      </div>
    </div>
  );
}

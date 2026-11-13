import { useEffect, useRef, useState } from "react";
import { Plus, ZoomIn, ZoomOut } from "lucide-react";
import { XrayImage } from "./xray-image";
const points = [
  { id: "engine", label: "Двигатель", x: 29, y: 43 },
  { id: "suspension", label: "Ходовая и тормоза", x: 23, y: 70 },
  { id: "electrics", label: "Электрика", x: 51, y: 33 },
  { id: "diagnostics", label: "Диагностика", x: 74, y: 60 },
];
export function VehicleInspector({
  src,
  model,
  active,
  onSelect,
  isActive,
}: {
  src: string;
  model: string;
  active: string | null;
  onSelect: (id: string | null) => void;
  isActive: boolean;
}) {
  const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  useEffect(() => {
    if (!isActive) {
      setZoom(false);
      setPan({ x: 0, y: 0 });
      setDragging(false);
      drag.current = null;
    }
  }, [isActive]);
  return (
    <div className="vehicle-explorer">
      <div
        className={`vehicle-explorer-viewport ${zoom ? "zoomed" : ""}`}
        tabIndex={zoom ? 0 : -1}
        role="group"
        aria-label={
          zoom
            ? "Увеличенное изображение. Перетаскивайте или используйте стрелки."
            : `Mercedes-Benz ${model}`
        }
        style={{ touchAction: zoom ? "none" : "pan-y" }}
        onKeyDown={(e) => {
          if (!zoom || e.target !== e.currentTarget) return;
          if (e.key === "Escape") {
            setZoom(false);
            setPan({ x: 0, y: 0 });
          }
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
          ) {
            e.preventDefault();
            e.stopPropagation();
            setPan((p) => ({
              x: Math.max(
                -100,
                Math.min(
                  100,
                  p.x +
                    (e.key === "ArrowLeft"
                      ? 18
                      : e.key === "ArrowRight"
                        ? -18
                        : 0),
                ),
              ),
              y: Math.max(
                -35,
                Math.min(
                  35,
                  p.y +
                    (e.key === "ArrowUp"
                      ? 12
                      : e.key === "ArrowDown"
                        ? -12
                        : 0),
                ),
              ),
            }));
          }
        }}
        onPointerDown={(e) => {
          if (!zoom || (e.target as HTMLElement).closest("button")) return;
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const max = e.currentTarget.clientWidth * 0.2;
          setPan({
            x: Math.max(
              -max,
              Math.min(max, drag.current.px + e.clientX - drag.current.x),
            ),
            y: Math.max(
              -35,
              Math.min(35, drag.current.py + e.clientY - drag.current.y),
            ),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <div
          className={`vehicle-explorer-frame ${dragging ? "dragging" : ""}`}
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom ? 1.65 : 1})`,
          }}
        >
          <XrayImage
            priority
            src={src}
            alt={`Mercedes-Benz ${model}`}
            cutaway={`media/xray/${src.includes("Rectangle17") ? "s" : src.includes("Rectangle18") ? "gle" : "e"}.webp`}
            enabled={isActive}
            controlsHost={controlsHost}
          >
            {points.map((p) => (
              <button
                key={p.id}
                className={`vehicle-node ${active === p.id ? "active" : ""}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                aria-label={`Узел: ${p.label}`}
                aria-pressed={active === p.id}
                onClick={() => onSelect(active === p.id ? null : p.id)}
              >
                <Plus size={16} />
                <span>{p.label}</span>
              </button>
            ))}
          </XrayImage>
        </div>
      </div>
      <div className="vehicle-explorer-controls">
        <div ref={setControlsHost} className="xray-controls-host" />
        <button
          className="vehicle-zoom"
          aria-pressed={zoom}
          onClick={() => {
            setZoom(!zoom);
            setPan({ x: 0, y: 0 });
          }}
        >
          {zoom ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          <span>{zoom ? "Общий вид" : "Приблизить"}</span>
        </button>
      </div>
      {zoom && <span className="vehicle-pan-hint">Перетащите изображение</span>}
    </div>
  );
}

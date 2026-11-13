import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import type { VehicleAsset } from "./vehicle-library";
import type { VehicleEngine } from "./vehicle-engine";
import "./vehicle-3d.css";

export function Vehicle3D({
  vehicle,
  hero = false,
  onStatusChange,
}: {
  vehicle: VehicleAsset;
  hero?: boolean;
  onStatusChange?: (state: "loading" | "ready" | "error") => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<VehicleEngine | null>(null),
    desired = useRef(vehicle);
  desired.current = vehicle;
  const statusCallback = useRef(onStatusChange);
  statusCallback.current = onStatusChange;
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [scan, setScan] = useState(false),
    [moving, setMoving] = useState(true);
  useEffect(() => {
    let disposed = false;
    import("./vehicle-engine")
      .then(({ createVehicleEngine }) => {
        if (disposed || !host.current) return;
        try {
          const instance = createVehicleEngine(host.current, hero, (s) => {
            if (!disposed) {
              setStatus(s);
              statusCallback.current?.(s);
            }
          });
          engine.current = instance;
          void instance.load(desired.current.file, hero);
        } catch {
          if (!disposed) {
            setStatus("error");
            statusCallback.current?.("error");
          }
        }
      })
      .catch(() => {
        if (!disposed) {
          setStatus("error");
          statusCallback.current?.("error");
        }
      });
    return () => {
      disposed = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, [hero]);
  useEffect(() => {
    if (engine.current) {
      setScan(false);
      engine.current.scan(false);
      void engine.current.load(vehicle.file, false);
    }
  }, [vehicle.file]);
  return (
    <div
      className={`vehicle-3d ${hero ? "vehicle-3d-hero" : ""}`}
      aria-label={`3D-обзор Mercedes-Benz ${vehicle.name} ${vehicle.generation}`}
    >
      <div className="vehicle-3d-canvas" ref={host} data-status={status} />
      {status === "loading" && (
        <div className="vehicle-3d-loading" role="status">
          <span />
          Подготавливаем {vehicle.name}…
        </div>
      )}
      {status === "error" && (
        <div className="vehicle-3d-error" role="status">
          3D-обзор сейчас недоступен. Вы можете выбрать услугу и записаться по
          телефону.
        </div>
      )}
      <div className="vehicle-3d-tools" aria-label="Управление 3D-моделью">
        <button
          onClick={() => engine.current?.rotate(-0.35)}
          disabled={status !== "ready"}
          aria-label="Повернуть машину влево"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          onClick={() => engine.current?.rotate(0.35)}
          disabled={status !== "ready"}
          aria-label="Повернуть машину вправо"
        >
          <ChevronRight size={17} />
        </button>
        <button
          className="vehicle-3d-scan"
          disabled={status !== "ready"}
          aria-pressed={scan}
          onClick={() => {
            engine.current?.scan(!scan);
            setScan(!scan);
          }}
        >
          <ScanLine size={16} />
          <span>
            {scan ? "Закрыть сканирование" : "Сканировать поверхность"}
          </span>
        </button>
        <button
          disabled={status !== "ready"}
          aria-pressed={!moving}
          onClick={() => {
            engine.current?.motion(!moving);
            setMoving(!moving);
          }}
          aria-label={
            moving
              ? "Приостановить движение машины"
              : "Включить движение машины"
          }
        >
          {moving ? <Pause size={15} /> : <Play size={15} />}
        </button>
        {hero && (
          <button
            disabled={status !== "ready"}
            onClick={() => engine.current?.replay()}
            aria-label="Повторить сборку из частиц"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>
      <p className="vehicle-3d-hint">
        {scan
          ? "Наведите на кузов. Скан показывает геометрию модели."
          : "Поверните автомобиль, чтобы рассмотреть его со всех сторон."}
      </p>
      <a
        className="vehicle-3d-credit"
        href={vehicle.credit.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        3D: {vehicle.credit.author} · CC BY
      </a>
    </div>
  );
}

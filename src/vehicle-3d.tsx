import { useEffect, useRef, useState } from "react";
import type { VehicleAsset } from "./vehicle-library";
import type { VehicleEngine } from "./vehicle-engine";
import { assetUrl } from "./assets";
import "./vehicle-3d.css";
export function Vehicle3D({
  vehicle,
  hero = false,
}: {
  vehicle: VehicleAsset;
  hero?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<VehicleEngine | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    import("./vehicle-engine")
      .then(({ createVehicleEngine }) => {
        if (disposed || !host.current) return;
        const instance = createVehicleEngine(host.current, hero, (s) => {
          if (!disposed && s === "error") setFailed(true);
        });
        engine.current = instance;
        void instance.load(hero ? "hero-slk.glb" : vehicle.file, hero);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, [hero, vehicle.file]);
  return (
    <div className={`vehicle-3d ${hero ? "vehicle-3d-hero" : ""}`}>
      <div
        className="vehicle-3d-canvas"
        ref={host}
        tabIndex={0}
        role="img"
        aria-label="Mercedes-Benz в движении: скан показывает двигатель и салон. Зажмите и перетащите автомобиль для вращения. Наведение показывает внутренности. Стрелки клавиатуры вращают модель."
      />
      {failed && (
        <img
          className="vehicle-3d-fallback"
          src={assetUrl(
            hero ? "media/vehicles/slk55.webp" : "media/vehicles/s65.webp",
          )}
          alt="Mercedes-Benz SLK 55 AMG"
        />
      )}
      <a
        className="vehicle-3d-credit"
        href={vehicle.credit.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        3D: {vehicle.credit.author} · {hero ? "SLK 55 AMG" : "CC BY"}
      </a>
    </div>
  );
}

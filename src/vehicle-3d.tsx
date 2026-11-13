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
        void instance.load(hero ? "hero-optimized.glb" : vehicle.file, hero);
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
        aria-label="Mercedes-Benz в движении: скан показывает двигатель и салон. Наведите на кузов; на телефоне коснитесь машины, с клавиатуры нажмите Enter."
      />
      {failed && (
        <img
          className="vehicle-3d-fallback"
          src={assetUrl("media/vehicles/s65.webp")}
          alt="Mercedes-Benz S-Класс"
        />
      )}
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

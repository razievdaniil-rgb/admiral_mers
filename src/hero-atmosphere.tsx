import { useEffect, useRef, useState } from "react";
import { Pause, Play, ScanLine } from "lucide-react";
import { assetUrl, media } from "./assets";
import "./hero-atmosphere.css";

/** Cinematic macro shots use the client-owned car photograph. */
export function HeroAtmosphere({
  interactive,
  onToggleView,
  onUnavailable,
}: {
  interactive: boolean;
  onToggleView: () => void;
  onUnavailable: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef(0);
  const pose = useRef([0, 0]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const surface = canvas.current;
    const host = surface?.closest<HTMLElement>(".fhero");
    const context = surface?.getContext("2d", { alpha: true });
    if (!surface || !host || !context) {
      onUnavailable();
      return;
    }
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    let width = 0,
      height = 0,
      frame = 0,
      previous = 0,
      elapsed = clock.current;
    let visible = true,
      disposed = false;
    let targetX = 0,
      targetY = 0,
      pointerX = pose.current[0],
      pointerY = pose.current[1];

    const photograph = new Image();
    photograph.src = assetUrl(media.hero);
    photograph.onload = () => {
      if (!disposed) draw(elapsed);
    };
    photograph.onerror = () => {
      if (!disposed) onUnavailable();
    };
    const shots = [
      {
        name: "grille",
        x: 0.76,
        y: 0.45,
        zoom: 2.65,
        dx: 0.055,
        dy: 0.015,
        dz: 0.3,
      },
      {
        name: "headlight",
        x: 0.53,
        y: 0.4,
        zoom: 2.8,
        dx: 0.06,
        dy: 0.025,
        dz: 0.25,
      },
      {
        name: "wheel",
        x: 0.41,
        y: 0.61,
        zoom: 3.1,
        dx: -0.02,
        dy: -0.025,
        dz: -0.2,
      },
      {
        name: "wide",
        x: 0.52,
        y: 0.44,
        zoom: 1.05,
        dx: -0.015,
        dy: 0.015,
        dz: 0.07,
      },
    ];
    const duration = 6800;
    const dissolve = 1500;
    const ease = (value: number) => value * value * (3 - 2 * value);
    function drawShot(index: number, progress: number, opacity: number) {
      if (!context || !photograph.complete || !photograph.naturalWidth) return;
      const shot = shots[index];
      const camera = ease(Math.max(0, Math.min(1, progress)));
      const wide = shot.name === "wide";
      const imageWidth = wide
        ? width * (width < 768 ? 1.38 : 1.03) * (1 + camera * 0.06)
        : Math.max(width * (shot.zoom + shot.dz * camera), height * 1.9);
      const imageHeight =
        (imageWidth * photograph.naturalHeight) / photograph.naturalWidth;
      const x =
        width * 0.5 - imageWidth * (shot.x + shot.dx * camera) + pointerX * 8;
      const y =
        height * (wide ? 0.54 : 0.53) -
        imageHeight * (shot.y + shot.dy * camera) +
        pointerY * 5;
      context.globalAlpha = opacity * (wide ? 0.92 : 0.72);
      context.drawImage(photograph, x, y, imageWidth, imageHeight);
      context.globalAlpha = 1;
    }
    function draw(time: number) {
      if (!context || !surface) return;
      context.clearRect(0, 0, width, height);
      const glow = context.createRadialGradient(
        width * 0.5,
        height * 0.52,
        0,
        width * 0.5,
        height * 0.52,
        width * 0.7,
      );
      glow.addColorStop(0, "rgba(102,119,145,.15)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      if (interactive) {
        surface.dataset.shot = "interactive";
        return;
      }
      if (motion.matches) {
        drawShot(3, 0.5, 1);
        surface.dataset.shot = "wide";
        return;
      }
      const shotIndex = Math.floor(time / duration) % shots.length;
      const localTime = time % duration;
      if (surface.dataset.shot !== shots[shotIndex].name)
        surface.dataset.shot = shots[shotIndex].name;
      const blend =
        localTime > duration - dissolve
          ? ease((localTime - duration + dissolve) / dissolve)
          : 0;
      drawShot(shotIndex, localTime / duration, 1 - blend);
      if (blend > 0) {
        // The next shot enters at its own start, so the dissolve ends without a jump.
        drawShot((shotIndex + 1) % shots.length, 0, blend);
      }
    }

    function tick(now: number) {
      if (disposed) return;
      const delta = previous ? Math.min(now - previous, 80) : 0;
      previous = now;
      elapsed += delta;
      clock.current = elapsed;
      const damping = 1 - Math.exp(-delta / 700);
      pointerX += (targetX - pointerX) * damping;
      pointerY += (targetY - pointerY) * damping;
      pose.current = [pointerX, pointerY];
      draw(elapsed);
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      previous = 0;
      const active =
        !paused &&
        !interactive &&
        !motion.matches &&
        visible &&
        !document.hidden;
      surface!.dataset.sceneState = motion.matches
        ? "reduced"
        : paused
          ? "paused"
          : active
            ? "running"
            : "idle";
      if (active) frame = requestAnimationFrame(tick);
      else draw(elapsed);
    }
    function resize() {
      const bounds = host!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(devicePixelRatio || 1, width < 768 ? 1.25 : 1.5);
      surface!.width = Math.round(width * ratio);
      surface!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.imageSmoothingQuality = "high";
      draw(elapsed);
    }
    function move(event: PointerEvent) {
      if (!finePointer.matches || motion.matches || paused) return;
      const bounds = host!.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    }
    function leave() {
      targetX = 0;
      targetY = 0;
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(host);
    observer.observe(host);
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    resize();
    sync();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizeObserver.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      photograph.onload = null;
      photograph.onerror = null;
    };
  }, [paused, interactive]);

  return (
    <>
      <div className="hero-atmosphere" aria-hidden="true">
        <canvas ref={canvas} />
        <div className="hero-atmosphere-shade" />
      </div>
      {!interactive && (
        <button
          className="hero-motion-toggle"
          onClick={() => setPaused(!paused)}
          aria-label={
            paused ? "Включить анимацию фона" : "Приостановить анимацию фона"
          }
          aria-pressed={paused}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          <span>{paused ? "Продолжить" : "Пауза"}</span>
        </button>
      )}
      <button
        className="hero-view-toggle"
        onClick={onToggleView}
        aria-pressed={interactive}
      >
        {interactive ? <Play size={15} /> : <ScanLine size={15} />}
        {interactive ? "Вернуться к анимации" : "Рассмотреть автомобиль"}
      </button>
    </>
  );
}

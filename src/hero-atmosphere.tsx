import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import "./hero-atmosphere.css";

/** A live silver-light studio, drawn behind the original Figma car. */
export function HeroAtmosphere() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef(0);
  const pose = useRef([0, 0]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const surface = canvas.current;
    const host = surface?.closest<HTMLElement>(".fhero");
    const context = surface?.getContext("2d", { alpha: true });
    if (!surface || !host || !context) return;
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

    function draw(time: number) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      const t = time * 0.00016;
      const driftX = pointerX * width * 0.022;
      const driftY = pointerY * height * 0.018;
      context.save();
      context.translate(driftX, driftY);

      // Broad reflected light gives the ribbons volume without flashing.
      const glowX = width * (0.5 + Math.sin(t * 0.7) * 0.16);
      const glow = context.createRadialGradient(
        glowX,
        height * 0.5,
        0,
        glowX,
        height * 0.5,
        width * 0.62,
      );
      glow.addColorStop(0, "rgba(137,158,186,.17)");
      glow.addColorStop(0.45, "rgba(78,96,123,.07)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = glow;
      context.fillRect(
        -width * 0.05,
        -height * 0.05,
        width * 1.1,
        height * 1.1,
      );

      // Large side reflectors frame the car and keep the centre clear.
      for (const side of [-1, 1]) {
        context.save();
        context.translate(width * 0.5, 0);
        context.scale(side, 1);
        const shift = Math.sin(t * 0.8) * width * 0.035;
        context.beginPath();
        context.moveTo(width * 0.68, height * 1.08);
        context.bezierCurveTo(
          width * 0.24 + shift,
          height * 0.75,
          width * 0.72,
          height * 0.08,
          width * 0.05,
          -height * 0.22,
        );
        context.bezierCurveTo(
          width * 0.8,
          height * 0.04,
          width * 0.32 + shift,
          height * 0.73,
          width * 0.78,
          height * 1.12,
        );
        context.closePath();
        const reflector = context.createLinearGradient(
          width * 0.1,
          0,
          width * 0.66,
          height * 0.6,
        );
        reflector.addColorStop(0, "rgba(112,134,162,0)");
        reflector.addColorStop(0.45, "rgba(158,182,210,.06)");
        reflector.addColorStop(0.7, "rgba(206,222,239,.25)");
        reflector.addColorStop(0.9, "rgba(96,119,151,.05)");
        reflector.addColorStop(1, "rgba(112,134,162,0)");
        context.fillStyle = reflector;
        context.fill();
        context.restore();
      }

      // Sweeping studio reflectors: each has a dark face and a silver edge.
      for (let i = 0; i < 7; i++) {
        const p = i / 6;
        const breath = Math.sin(t + i * 0.53);
        const y = height * (0.12 + p * 0.125) + breath * height * 0.035;
        const spread = height * (0.19 + p * 0.1);
        context.beginPath();
        context.moveTo(-width * 0.18, y + spread);
        context.bezierCurveTo(
          width * 0.17,
          y - spread * 0.8,
          width * 0.58,
          y + spread * 0.9,
          width * 1.18,
          y - spread,
        );
        const silver = context.createLinearGradient(0, 0, width, height * 0.3);
        const gleam = 0.43 + Math.sin(t * 0.8 + i * 0.7) * 0.14;
        silver.addColorStop(0, "rgba(136,155,181,0)");
        silver.addColorStop(
          Math.max(0.05, gleam - 0.25),
          "rgba(87,106,132,.04)",
        );
        silver.addColorStop(gleam, `rgba(200,217,237,${i % 2 ? 0.4 : 0.65})`);
        silver.addColorStop(
          Math.min(0.95, gleam + 0.25),
          "rgba(87,106,132,.05)",
        );
        silver.addColorStop(1, "rgba(136,155,181,0)");
        context.strokeStyle = silver;
        context.lineWidth = Math.max(12, height * (0.025 + p * 0.02));
        context.globalAlpha = 0.45;
        context.stroke();
        context.lineWidth = Math.max(1, height * 0.0015);
        context.globalAlpha = 0.85;
        context.stroke();
      }

      // Elliptical pool of light anchors the car to a studio floor.
      context.globalAlpha = 1;
      context.translate(width * 0.5, height * 0.79);
      context.scale(1, 0.13);
      const pool = context.createRadialGradient(
        0,
        0,
        width * 0.08,
        0,
        0,
        width * 0.54,
      );
      pool.addColorStop(0, "rgba(166,186,210,.02)");
      pool.addColorStop(0.62 + Math.sin(t) * 0.025, "rgba(166,186,210,.13)");
      pool.addColorStop(0.7, "rgba(192,208,227,.2)");
      pool.addColorStop(0.74, "rgba(111,132,160,.05)");
      pool.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = pool;
      context.fillRect(-width * 0.6, -width * 0.6, width * 1.2, width * 1.2);
      context.restore();
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
      const active = !paused && !motion.matches && visible && !document.hidden;
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
    };
  }, [paused]);

  return (
    <>
      <div className="hero-atmosphere" aria-hidden="true">
        <canvas ref={canvas} />
        <div className="hero-atmosphere-shade" />
      </div>
      <button
        className="hero-motion-toggle"
        onClick={() => setPaused(!paused)}
        aria-label={
          paused ? "Включить анимацию фона" : "Приостановить анимацию фона"
        }
        aria-pressed={paused}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
        <span>{paused ? "Включить фон" : "Пауза фона"}</span>
      </button>
    </>
  );
}

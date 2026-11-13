import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import "./hero-atmosphere.css";

type Particle = {
  u: number;
  v: number;
  band: number;
  phase: number;
  size: number;
  brightness: number;
  pushX: number;
  pushY: number;
};

/** Original silver point-cloud scene; the foreground car stays interactive. */
export function HeroAtmosphere() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef(0);
  const pose = useRef([0, 0]);
  const cloud = useRef<Particle[]>([]);
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
    let pointerInside = false;
    let targetX = 0,
      targetY = 0,
      pointerX = pose.current[0],
      pointerY = pose.current[1];

    let randomSeed = 2741;
    const random = () => {
      randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
      return randomSeed / 4294967296;
    };
    const particles = cloud.current.length
      ? cloud.current
      : Array.from({ length: 6000 }, () => ({
          u: random() * Math.PI * 2,
          v: random() * Math.PI * 2,
          band: Math.sqrt(random()),
          phase: random() * Math.PI * 2,
          size: 0.8 + random() * 1.2,
          brightness: 0.2 + random() * 0.8,
          pushX: 0,
          pushY: 0,
        }));
    cloud.current = particles;
    const smooth = (value: number) => value * value * (3 - 2 * value);
    function shape(
      mode: number,
      u: number,
      v: number,
      band: number,
      time: number,
    ) {
      const tube = band * 0.16;
      if (mode === 0)
        return [
          Math.cos(u) * (0.84 + Math.cos(v) * tube),
          Math.sin(u) * (0.66 + Math.cos(v) * tube),
          Math.sin(v) * tube + Math.sin(u) * 0.12,
        ];
      if (mode === 1) {
        const x = u / Math.PI - 1;
        return [
          x * 1.12,
          Math.sin(x * 3.4 + time * 0.14) * 0.44 + Math.cos(v) * tube,
          Math.sin(v) * tube + Math.cos(x * 3) * 0.15,
        ];
      }
      return [
        Math.cos(u) * (0.85 + Math.cos(v) * tube),
        Math.sin(u * 2) * 0.47 + Math.cos(v) * tube,
        Math.sin(v) * tube + Math.sin(u) * 0.22,
      ];
    }
    let lastDraw = 0;
    function draw(time: number) {
      if (!context || !surface) return;
      const t = time * 0.001;
      const delta = Math.min(Math.max(time - lastDraw, 0), 80);
      lastDraw = time;
      context.clearRect(0, 0, width, height);
      const glow = context.createRadialGradient(
        width * 0.5,
        height * 0.55,
        0,
        width * 0.5,
        height * 0.55,
        width * 0.64,
      );
      glow.addColorStop(0, "rgba(100,126,158,.11)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      const cycle = motion.matches ? 0 : (t / 15) % 3;
      const mode = Math.floor(cycle);
      const mix = smooth(cycle - mode);
      const count = width < 600 ? 1800 : width < 1100 ? 3800 : 6000;
      if (surface.dataset.scene !== "particles")
        surface.dataset.scene = "particles";
      const recover = 1 - Math.exp(-delta / 450);
      const intro = motion.matches ? 1 : smooth(Math.min(1, t / 2.3));
      for (let i = 0; i < count; i++) {
        const point = particles[i];
        const u = (point.u + (motion.matches ? 0 : t * 0.045)) % (Math.PI * 2);
        const a = shape(mode, u, point.v, point.band, t);
        const b = shape((mode + 1) % 3, u, point.v, point.band, t);
        const z = a[2] + (b[2] - a[2]) * mix;
        const perspective = 1 / (1 - z * 0.42);
        let x =
          width * 0.5 +
          (a[0] + (b[0] - a[0]) * mix) * width * 0.61 * perspective;
        let y =
          height * 0.54 +
          (a[1] + (b[1] - a[1]) * mix) * height * 0.65 * perspective;
        x += Math.cos(point.phase) * width * 0.22 * (1 - intro);
        y += Math.sin(point.phase) * height * 0.22 * (1 - intro);
        if (!motion.matches && !paused) {
          const dx = x - (width * 0.5 + pointerX * width * 0.5);
          const dy = y - (height * 0.5 + pointerY * height * 0.5);
          const distance = Math.hypot(dx, dy);
          const radius = Math.min(150, width * 0.18);
          const force =
            finePointer.matches && pointerInside && distance < radius
              ? Math.pow(1 - distance / radius, 2) * 48
              : 0;
          const safeDistance = Math.max(1, distance);
          point.pushX += ((dx / safeDistance) * force - point.pushX) * recover;
          point.pushY += ((dy / safeDistance) * force - point.pushY) * recover;
        }
        const size = point.size * perspective * (width < 600 ? 0.85 : 1);
        const shimmer = motion.matches
          ? 1
          : 0.82 + Math.sin(t * 0.65 + point.phase) * 0.18;
        context.globalAlpha = Math.min(
          0.85,
          (0.4 + point.brightness * 0.58) * shimmer * intro,
        );
        context.fillStyle = i % 7 === 0 ? "#9cb5d2" : "#d4dde8";
        context.fillRect(x + point.pushX, y + point.pushY, size, size);
      }
      context.globalAlpha = 1;
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
      context!.imageSmoothingQuality = "high";
      draw(elapsed);
    }
    function move(event: PointerEvent) {
      if (!finePointer.matches || motion.matches || paused) return;
      pointerInside = true;
      const bounds = host!.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    }
    function leave() {
      pointerInside = false;
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
        <span>{paused ? "Продолжить" : "Пауза"}</span>
      </button>
    </>
  );
}

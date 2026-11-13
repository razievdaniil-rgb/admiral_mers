import { useLayoutEffect, useRef, type ReactNode } from "react";
import { assetUrl, media } from "./assets";
import "./car-assembly.css";

/** One entrance: scattered samples gather into the actual car photograph. */
export function CarAssembly({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const host = root.current,
      surface = canvas.current;
    if (!host || !surface) return;
    const context = surface.getContext("2d");
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (!context || preference.matches) return;
    let disposed = false,
      finished = false,
      frame = 0,
      elapsed = 0,
      previous = 0;
    let width = 0,
      height = 0;
    let points: {
      x: number;
      y: number;
      sx: number;
      sy: number;
      color: string;
      seed: number;
    }[] = [];
    const image = new Image();
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      finished = true;
      clearTimeout(fallback);
      cancelAnimationFrame(frame);
      host.dataset.assembly = "ready";
      host.style.setProperty("--car-body-opacity", "1");
      host.inert = false;
      context.clearRect(0, 0, width, height);
    };
    const ease = (p: number) =>
      1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      const density = Math.min(devicePixelRatio || 1, 1.5);
      surface.width = Math.round(width * density);
      surface.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
    };
    const tick = (now: number) => {
      if (disposed) return;
      elapsed += previous ? Math.min(now - previous, 80) : 0;
      previous = now;
      const t = elapsed / 1000;
      const body = ease((t - 2.05) / 1.25);
      host.style.setProperty("--car-body-opacity", String(body));
      context.clearRect(0, 0, width, height);
      const fit = Math.min(
        width / image.naturalWidth,
        height / image.naturalHeight,
      );
      const imageWidth = image.naturalWidth * fit,
        imageHeight = image.naturalHeight * fit;
      const left = (width - imageWidth) / 2,
        top = (height - imageHeight) / 2;
      for (const point of points) {
        const progress = ease((t - point.seed * 0.4) / 2.1);
        const tx = left + point.x * imageWidth,
          ty = top + point.y * imageHeight;
        const x = tx + point.sx * width * (1 - progress);
        const y = ty + point.sy * height * (1 - progress);
        const swirl = Math.sin(progress * Math.PI) * (1 - progress);
        context.globalAlpha =
          Math.min(1, t * 2) * (1 - body) * (0.55 + progress * 0.45);
        context.fillStyle = point.color;
        const size = (width < 600 ? 1.2 : 1.65) + (1 - progress) * 0.7;
        context.fillRect(
          x + Math.sin(point.seed * 12 + t) * swirl * 45,
          y + Math.cos(point.seed * 10 + t) * swirl * 30,
          size,
          size,
        );
      }
      context.globalAlpha = 1;
      if (t >= 3.35) finish();
      else frame = requestAnimationFrame(tick);
    };
    image.onload = () => {
      if (disposed || finished) return;
      if (preference.matches || document.hidden) {
        finish();
        return;
      }
      try {
        const sampler = document.createElement("canvas");
        sampler.width = 280;
        sampler.height = Math.round(
          (280 * image.naturalHeight) / image.naturalWidth,
        );
        const sample = sampler.getContext("2d", { willReadFrequently: true });
        if (!sample) {
          finish();
          return;
        }
        sample.drawImage(image, 0, 0, sampler.width, sampler.height);
        const pixels = sample.getImageData(
          0,
          0,
          sampler.width,
          sampler.height,
        ).data;
        for (let y = 0; y < sampler.height; y += 2)
          for (let x = 0; x < sampler.width; x += 2) {
            const i = (y * sampler.width + x) * 4;
            const light = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            if (
              pixels[i + 3] < 150 ||
              light < 43 ||
              (y > sampler.height * 0.8 && light < 95)
            )
              continue;
            const seed = ((x * 73 + y * 137) % 997) / 997;
            const angle = seed * Math.PI * 2;
            points.push({
              x: x / sampler.width,
              y: y / sampler.height,
              sx: Math.cos(angle) * (0.3 + seed * 0.7),
              sy: Math.sin(angle) * (0.35 + seed * 0.65),
              color: `rgb(${Math.min(255, pixels[i] + 30)},${Math.min(255, pixels[i + 1] + 30)},${Math.min(255, pixels[i + 2] + 35)})`,
              seed,
            });
          }
        if (!points.length) {
          finish();
          return;
        }
        resize();
        host.dataset.assembly = "assembling";
        host.style.setProperty("--car-body-opacity", "0");
        host.inert = true;
        frame = requestAnimationFrame(tick);
      } catch {
        finish();
      }
    };
    image.onerror = finish;
    host.dataset.assembly = "assembling";
    host.style.setProperty("--car-body-opacity", "0");
    host.inert = true;
    fallback = setTimeout(finish, 7000);
    image.src = assetUrl(media.hero);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const onPreference = () => {
      if (preference.matches) finish();
    };
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    preference.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      image.onload = null;
      image.onerror = null;
      finish();
      points = [];
    };
  }, []);
  return (
    <div className="car-assembly" ref={root} data-assembly="ready">
      {children}
      <canvas
        ref={canvas}
        className="car-assembly-particles"
        aria-hidden="true"
      />
    </div>
  );
}

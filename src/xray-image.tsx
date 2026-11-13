import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ScanLine, Eye } from "lucide-react";
import { assetUrl } from "./assets";

type Props = {
  src: string;
  cutaway: string;
  alt: string;
  className?: string;
  priority?: boolean;
  enabled?: boolean;
  children?: ReactNode;
  controlsHost?: HTMLElement | null;
};
export function XrayImage({
  src,
  cutaway,
  alt,
  className = "",
  priority = false,
  enabled = true,
  children,
  controlsHost,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const motion = useRef({ x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0, last: 0 });
  const hover = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [pinned, setPinned] = useState(false);
  const [ready, setReady] = useState(false);
  const description = useId();
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const update = () => {
    const el = root.current;
    if (!el) return;
    const m = motion.current;
    if (frame.current !== null) return;
    const step = (now: number) => {
      const dt = m.last ? Math.min(50, now - m.last) : 16;
      m.last = now;
      const k = 1 - Math.exp(-dt / 95),
        kr = 1 - Math.exp(-dt / 125);
      m.x += (m.tx - m.x) * k;
      m.y += (m.ty - m.y) * k;
      m.r += (m.tr - m.r) * kr;
      el.style.setProperty("--xr-x", `${m.x}px`);
      el.style.setProperty("--xr-y", `${m.y}px`);
      el.style.setProperty("--xr-radius", `${m.r}px`);
      if (
        Math.abs(m.x - m.tx) + Math.abs(m.y - m.ty) + Math.abs(m.r - m.tr) >
        0.2
      )
        frame.current = requestAnimationFrame(step);
      else {
        if (m.tr === 0) {
          m.r = 0;
          el.style.setProperty("--xr-radius", "0px");
          el.dataset.lens = "closed";
        }
        frame.current = null;
        m.last = 0;
      }
    };
    frame.current = requestAnimationFrame(step);
  };
  const target = (x: number, y: number, r: number) => {
    const m = motion.current;
    m.tx = x;
    m.ty = y;
    m.tr = r;
    if (r > 0 && root.current) root.current.dataset.lens = "open";
    if (reduced()) {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      m.x = x;
      m.y = y;
      m.r = r;
      root.current?.style.setProperty("--xr-x", `${x}px`);
      root.current?.style.setProperty("--xr-y", `${y}px`);
      root.current?.style.setProperty("--xr-radius", `${r}px`);
      if (root.current) root.current.dataset.lens = r > 0 ? "open" : "closed";
    } else update();
  };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!enabled) {
      setPinned(false);
      hover.current = false;
      target(motion.current.tx, motion.current.ty, 0);
      return;
    }
    if (pinned)
      target(
        el.clientWidth * 0.5,
        el.clientHeight * 0.45,
        Math.hypot(el.clientWidth, el.clientHeight),
      );
    else target(motion.current.tx, motion.current.ty, 0);
  }, [pinned, enabled]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (pinned && enabled)
        target(
          el.clientWidth * 0.5,
          el.clientHeight * 0.45,
          Math.hypot(el.clientWidth, el.clientHeight),
        );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [pinned, enabled]);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      motion.current.last = 0;
    },
    [],
  );
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || pinned || e.pointerType === "touch" || reduced()) return;
    const el = e.currentTarget,
      r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) * el.clientWidth) / r.width,
      y = ((e.clientY - r.top) * el.clientHeight) / r.height;
    if (!hover.current) {
      motion.current.x = x;
      motion.current.y = y;
      hover.current = true;
    }
    target(x, y, Math.max(65, Math.min(160, el.clientWidth * 0.2)));
  };
  return (
    <div
      ref={root}
      className={`xray-image ${className} ${pinned ? "xray-pinned" : ""} ${ready ? "xray-ready" : ""}`}
      data-lens="closed"
      aria-describedby={description}
      onPointerEnter={move}
      onPointerMove={move}
      onPointerLeave={() => {
        hover.current = false;
        if (!pinned) target(motion.current.tx, motion.current.ty, 0);
      }}
      onPointerDown={(e) => {
        if (
          e.pointerType === "touch" &&
          !(e.target as HTMLElement).closest("button,a")
        )
          touch.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        if (
          touch.current &&
          Math.hypot(e.clientX - touch.current.x, e.clientY - touch.current.y) <
            8
        )
          setPinned((p) => !p);
        touch.current = null;
      }}
      onPointerCancel={() => {
        touch.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && pinned) {
          setPinned(false);
          e.stopPropagation();
        }
      }}
    >
      <img
        className="xray-surface"
        src={assetUrl(src)}
        alt={alt}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
      <div className="xray-reveal" aria-hidden="true">
        <img
          src={assetUrl(cutaway)}
          alt=""
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setReady(true)}
          onError={() => setReady(false)}
        />
      </div>
      <div className="xray-lens" aria-hidden="true" />
      {children}
      <span id={description} className="sr-only">
        Наведите курсор или нажмите «Показать внутренности». Иллюстративный
        разрез, устройство конкретной комплектации может отличаться.
      </span>
      {controlsHost ? (
        createPortal(
          <button
            className="xray-toggle"
            aria-pressed={pinned}
            onClick={() => setPinned((p) => !p)}
          >
            {pinned ? <Eye size={16} /> : <ScanLine size={16} />}
            <span>{pinned ? "Показать кузов" : "Показать внутренности"}</span>
          </button>,
          controlsHost,
        )
      ) : (
        <button
          className="xray-toggle"
          aria-pressed={pinned}
          onClick={() => setPinned((p) => !p)}
        >
          {pinned ? <Eye size={16} /> : <ScanLine size={16} />}
          <span>{pinned ? "Показать кузов" : "Показать внутренности"}</span>
        </button>
      )}
      <span className="xray-caption" aria-hidden="true">
        Иллюстрация узлов
      </span>
    </div>
  );
}

import { useEffect, useRef } from "react";
import "./hero-atmosphere.css";
export function HeroAtmosphere() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let visible = false;
    const update = () => {
      element.dataset.active = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div
      className="hero-atmosphere"
      ref={root}
      data-active="false"
      aria-hidden="true"
    >
      <div className="hero-dust" />
      <div className="hero-dust hero-dust-far" />
      <div className="hero-dust hero-dust-glints" />
    </div>
  );
}

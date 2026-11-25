import { useLayoutEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";
let activeScroll: Lenis | null = null;
export function scrollToSection(element: HTMLElement) {
  if (activeScroll) {
    activeScroll.scrollTo(element, {
      offset: -100,
      duration: 0.85,
      force: true,
    });
  } else {
    element.scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
}
export function SmoothScroll() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width:900px) and (prefers-reduced-motion:no-preference)",
      () => {
        const lenis = new Lenis({
          duration: 1.1,
          smoothWheel: true,
          syncTouch: false,
          prevent: (node) =>
            !!node.closest("dialog,.vehicle-explorer-viewport.zoomed,select"),
        });
        activeScroll = lenis;
        const tick = (time: number) => lenis.raf(time * 1000);
        const reset = () => lenis.scrollTo(0, { immediate: true, force: true });
        const lock = () => {
          if (document.body.style.overflow === "hidden") lenis.stop();
          else lenis.start();
        };
        const observer = new MutationObserver(lock);
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ["style"],
        });
        lock();
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(tick);
        window.addEventListener("hashchange", reset);
        return () => {
          observer.disconnect();
          window.removeEventListener("hashchange", reset);
          gsap.ticker.remove(tick);
          lenis.destroy();
          if (activeScroll === lenis) activeScroll = null;
        };
      },
    );
    return () => mm.revert();
  }, []);
  return null;
}

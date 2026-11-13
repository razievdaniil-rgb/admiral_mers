import { useLayoutEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";
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
        };
      },
    );
    return () => mm.revert();
  }, []);
  return null;
}

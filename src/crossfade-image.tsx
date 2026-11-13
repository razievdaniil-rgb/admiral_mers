import { useEffect, useRef, useState } from "react";

type Frame = { src: string; alt: string };
// Keep the last decoded frame on screen while the next photograph loads.
export function CrossfadeImage({ src, alt }: Frame) {
  const [frame, setFrame] = useState<Frame>({ src, alt });
  const [previous, setPrevious] = useState<Frame | null>(null);
  const current = useRef(frame);
  useEffect(() => {
    if (src === current.current.src) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const image = new Image();
    image.src = src;
    image
      .decode()
      .then(() => {
        if (cancelled) return;
        setPrevious(current.current);
        current.current = { src, alt };
        setFrame(current.current);
        timer = setTimeout(() => setPrevious(null), 700);
      })
      .catch(() => {
        /* Leave the working photograph visible. */
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [src, alt]);
  return (
    <span className="crossfade-image">
      {previous && (
        <img
          className="crossfade-previous"
          src={previous.src}
          alt=""
          aria-hidden="true"
        />
      )}
      <img
        key={frame.src}
        className={
          previous ? "crossfade-current is-entering" : "crossfade-current"
        }
        src={frame.src}
        alt={frame.alt}
        loading="lazy"
      />
    </span>
  );
}

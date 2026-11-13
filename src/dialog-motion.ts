import { useEffect, useRef, useState } from "react";

export function useDialogMotion(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callback = useRef(onClose);
  callback.current = onClose;
  useEffect(() => () => clearTimeout(timer.current), []);
  function dismiss(after?: () => void) {
    if (timer.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      callback.current();
      if (after) requestAnimationFrame(after);
      return;
    }
    setClosing(true);
    timer.current = setTimeout(() => {
      callback.current();
      if (after) requestAnimationFrame(after);
    }, 180);
  }
  return { closing, dismiss };
}

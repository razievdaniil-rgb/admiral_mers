import { useDialogMotion } from "./dialog-motion";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Service } from "./data";
import { prices, formatPrice } from "./pricing";
import { telegram } from "./contact";
export function CategoryModal({
  service,
  model,
  onClose,
}: {
  service: Service;
  model: string;
  onClose: () => void;
}) {
  const { closing, dismiss } = useDialogMotion(onClose);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const el = dialog.current,
      previous = document.body.style.overflow;
    el?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = previous;
      opener.current?.focus();
    };
  }, []);
  const url = `#/services/${service.id}${model ? "?model=" + encodeURIComponent(model) : ""}`;
  return (
    <dialog
      ref={dialog}
      className={`category-dialog ${closing ? "is-closing" : ""}`}
      aria-labelledby="category-title"
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <button
        className="icon-button modal-close"
        aria-label="Закрыть список работ"
        onClick={() => dismiss()}
      >
        <X size={20} />
      </button>
      <h2 id="category-title">{service.short}</h2>
      <p>
        {model ? `${model}. ` : ""}
        {service.intro}
      </p>
      <ul className="category-work-list">
        {service.works.map((w) => (
          <li key={w}>
            <a
              href={
                service.id === "engine" && /трансмис/i.test(w)
                  ? `#/services/transmission${model ? "?model=" + encodeURIComponent(model) : ""}`
                  : url
              }
              onClick={onClose}
            >
              {w}
            </a>
          </li>
        ))}
      </ul>
      <div className="category-price-list">
        {prices
          .filter((p) => p.service === service.id)
          .map((p) => (
            <div key={p.id}>
              <span>{p.name}</span>
              <strong>{formatPrice(p.price)}</strong>
            </div>
          ))}
      </div>
      <p className="category-price-note">
        Цены за работу, без запчастей. Итоговую стоимость согласуем до начала
        ремонта.
      </p>
      <div className="category-actions">
        <a className="text-link" href={url} onClick={onClose}>
          Подробнее об услуге
        </a>
        <a
          className="button"
          href={telegram}
          target="_blank"
          rel="noopener noreferrer"
        >
          Написать в Telegram
        </a>
      </div>
    </dialog>
  );
}

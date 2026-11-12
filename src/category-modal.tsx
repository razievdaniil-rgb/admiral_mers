import { useEffect, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";
import type { Service } from "./data";
export function CategoryModal({
  service,
  model,
  onClose,
  onBook,
}: {
  service: Service;
  model: string;
  onClose: () => void;
  onBook: () => void;
}) {
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
      className="category-dialog"
      aria-labelledby="category-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        className="icon-button modal-close"
        aria-label="Закрыть список работ"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <h2 id="category-title">{service.short}</h2>
      <p>
        {model ? `${model}. ` : ""}
        {service.intro}
      </p>
      <table>
        <thead>
          <tr>
            <th>Название услуги</th>
            <th>Комментарий</th>
            <th>Стоимость</th>
          </tr>
        </thead>
        <tbody>
          {service.works.map((w) => (
            <tr key={w}>
              <td>
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
              </td>
              <td>Перечень уточняется после осмотра</td>
              <td>По согласованию</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="category-actions">
        <a className="text-link" href={url} onClick={onClose}>
          Подробнее об услуге
          <ArrowUpRight size={17} />
        </a>
        <button
          className="button"
          onClick={() => {
            onClose();
            requestAnimationFrame(onBook);
          }}
        >
          Обсудить работы
          <ArrowUpRight size={17} />
        </button>
      </div>
    </dialog>
  );
}

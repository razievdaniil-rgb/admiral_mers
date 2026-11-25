import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle, Phone, ChevronDown } from "lucide-react";
import { phone, telephone } from "./data";
export const telegram = "https://t.me/MB_ADMIRAL";
export const whatsapp = "https://wa.me/79164583217";
export function consultationLink(model: string, service?: string) {
  return `${whatsapp}?text=${encodeURIComponent(`Здравствуйте! Хочу обсудить ${service ? service.toLocaleLowerCase("ru-RU") : "обслуживание"}: ${model}.`)}`;
}
export function ContactLinks({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const dismiss = () => panel.current?.hidePopover();
    addEventListener("resize", dismiss);
    addEventListener("hashchange", dismiss);
    addEventListener("scroll", dismiss, { capture: true, passive: true });
    return () => {
      removeEventListener("resize", dismiss);
      removeEventListener("hashchange", dismiss);
      removeEventListener("scroll", dismiss, true);
    };
  }, [open]);
  const positionPanel = (button: HTMLButtonElement) => {
    if (!panel.current) return;
    const bounds = button.getBoundingClientRect();
    const width = Math.min(224, innerWidth - 24);
    panel.current.style.width = `${width}px`;
    panel.current.style.left = `${Math.max(12, Math.min(bounds.right - width, innerWidth - width - 12))}px`;
    panel.current.style.top = `${innerHeight - bounds.bottom >= 170 ? bounds.bottom + 8 : Math.max(12, bounds.top - 164)}px`;
  };
  return (
    <div className={`contact-links contact-group ${compact ? "compact" : ""}`}>
      <a href={telephone} aria-label={`Позвонить: ${phone}`}>
        <Phone size={17} />
        <span>{compact ? "Позвонить" : phone}</span>
      </a>
      <div className="contact-message-group">
        <button
          type="button"
          className="contact-write"
          popoverTarget={id}
          aria-expanded={open}
          aria-controls={id}
          onClick={(e) => positionPanel(e.currentTarget)}
        >
          <MessageCircle size={17} />
          <span>Написать</span>
          <ChevronDown size={15} />
        </button>
        <div
          ref={panel}
          id={id}
          popover="auto"
          className="contact-popover"
          aria-label="Выберите мессенджер"
          onToggle={() =>
            setOpen(panel.current?.matches(":popover-open") || false)
          }
        >
          <p>Выберите мессенджер</p>
          <a
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => panel.current?.hidePopover()}
          >
            <MessageCircle size={17} />
            Telegram
          </a>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => panel.current?.hidePopover()}
          >
            <MessageCircle size={17} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

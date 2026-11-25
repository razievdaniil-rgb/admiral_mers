import { MessageCircle, Phone, ArrowUpRight } from "lucide-react";
import { phone, telephone } from "./data";
export const telegram = "https://t.me/MB_ADMIRAL";
export const whatsapp = "https://wa.me/79164583217";
export function consultationLink(model: string, service?: string) {
  return `${whatsapp}?text=${encodeURIComponent(`Здравствуйте! Хочу обсудить ${service ? service.toLocaleLowerCase("ru-RU") : "обслуживание"}: ${model}.`)}`;
}
export function ContactLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`contact-links ${compact ? "compact" : ""}`}>
      <a href={telephone} aria-label={`Позвонить: ${phone}`}>
        <Phone size={17} />
        <span>{compact ? "Позвонить" : phone}</span>
      </a>
      <a href={telegram} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={17} />
        Telegram
        <ArrowUpRight size={14} />
      </a>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer">
        WhatsApp
        <ArrowUpRight size={14} />
      </a>
    </div>
  );
}

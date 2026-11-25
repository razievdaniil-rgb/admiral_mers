import { Plus } from "lucide-react";

// Positions follow the white SUV's registered 1335 × 701 exterior/cutaway pair.
const parts = [
  {
    id: "transmission",
    title: "КПП, раздатка и редукторы",
    label: "Трансмиссия",
    left: 42,
    top: 63,
    width: 16,
    height: 12,
  },
  {
    id: "engine",
    title: "Ремонт двигателя",
    label: "Двигатель",
    left: 58,
    top: 29,
    width: 28,
    height: 23,
  },
  {
    id: "suspension",
    title: "Ходовая и тормоза",
    label: "Переднее колесо и подвеска",
    left: 27,
    top: 59,
    width: 20,
    height: 27,
  },
  {
    id: "body",
    title: "Кузовной ремонт",
    label: "Кузов",
    left: 12,
    top: 38,
    width: 19,
    height: 20,
  },
  {
    id: "electrics",
    title: "Электрика и электроника",
    label: "Салон и электроника",
    left: 32,
    top: 9,
    width: 30,
    height: 22,
  },
];

export function HeroServiceHotspots() {
  return (
    <div
      className="hero-service-hotspots"
      role="group"
      aria-label="Услуги по узлам автомобиля"
    >
      {parts.map((part) => (
        <a
          key={part.id}
          href={`#/services/${part.id}`}
          className={`hero-part hero-part-${part.id}`}
          aria-label={`${part.label}: ${part.title}`}
          style={{
            left: `${part.left}%`,
            top: `${part.top}%`,
            width: `${part.width}%`,
            height: `${part.height}%`,
          }}
        >
          <span className="hero-part-marker" aria-hidden="true">
            <Plus size={14} />
          </span>
          <span className="hero-part-label">
            <strong>{part.title}</strong>
            <span>Подробнее об услуге</span>
          </span>
        </a>
      ))}
    </div>
  );
}

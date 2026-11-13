import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
} from "lucide-react";
import { assetUrl, media } from "./assets";
import { branches, branchStatus, mapLink } from "./data";
import "./branch-showcase.css";
const photos = [
  {
    name: "Фасад",
    src: media.history,
    alt: "Фасад техцентра — временное фото для макета",
  },
  {
    name: "Ремзона",
    src: media.workshop,
    alt: "Ремонтная зона — временное фото для макета",
  },
  {
    name: "Приёмка",
    src: media.service,
    alt: "Работа с автомобилем — временное фото для блока приёмки",
  },
  {
    name: "Работы",
    src: "media/services/maintenance.webp",
    alt: "Обслуживание автомобиля — временная иллюстрация",
  },
];
function GalleryDialog({
  branch,
  index,
  onClose,
}: {
  branch: string;
  index: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    opener = useRef(document.activeElement as HTMLElement | null);
  const [photo, setPhoto] = useState(index);
  useEffect(() => {
    const d = ref.current;
    const previous = document.body.style.overflow;
    d?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = previous;
      opener.current?.focus();
    };
  }, []);
  const next = (direction: number) =>
    setPhoto((photo + direction + photos.length) % photos.length);
  return (
    <dialog
      ref={ref}
      className="branch-gallery-dialog"
      aria-labelledby="branch-gallery-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") next(1);
        if (e.key === "ArrowLeft") next(-1);
      }}
    >
      <div className="branch-gallery-header">
        <div>
          <p>ТехЦентр Адмирал</p>
          <h2 id="branch-gallery-title">
            {branch} · {photos[photo].name}
          </h2>
        </div>
        <button aria-label="Закрыть фотографии" onClick={onClose}>
          <X />
        </button>
      </div>
      <img src={assetUrl(photos[photo].src)} alt={photos[photo].alt} />
      <div className="branch-gallery-footer">
        <button aria-label="Предыдущее фото" onClick={() => next(-1)}>
          <ChevronLeft />
        </button>
        <span>
          {photo + 1} / {photos.length} · Временные фото для макета
        </span>
        <button aria-label="Следующее фото" onClick={() => next(1)}>
          <ChevronRight />
        </button>
      </div>
    </dialog>
  );
}
function BranchCard({
  branch,
  onBook,
}: {
  branch: (typeof branches)[number];
  onBook: (id: string) => void;
}) {
  const [photo, setPhoto] = useState(0),
    [gallery, setGallery] = useState(false);
  return (
    <article className="branch-showcase-card">
      <button
        className="branch-showcase-photo"
        onClick={() => setGallery(true)}
        aria-label={`Посмотреть фотографии: ${branch.name}`}
      >
        <img
          key={photo}
          src={assetUrl(photos[photo].src)}
          alt={photos[photo].alt}
          loading="lazy"
        />
        <span className="branch-photo-note">Временные фото</span>
        <span className="branch-photo-expand">
          <Expand size={17} />
        </span>
      </button>
      <div
        className="branch-photo-tabs"
        role="group"
        aria-label={`Фотографии техцентра: ${branch.name}`}
      >
        {photos.map((p, i) => (
          <button
            key={p.name}
            aria-pressed={photo === i}
            onClick={() => setPhoto(i)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="branch-showcase-copy">
        <span className={`branch-showcase-status ${branch.new ? "new" : ""}`}>
          {branchStatus(branch.new)}
        </span>
        <h3>{branch.name}</h3>
        <p>{branch.address}</p>
        <div className="branch-showcase-actions">
          <a
            className="button"
            href={mapLink(branch.address)}
            target="_blank"
            rel="noreferrer"
          >
            Построить маршрут <ArrowUpRight size={17} />
          </a>
          <button className="text-link" onClick={() => onBook(branch.id)}>
            Записаться <ArrowUpRight size={17} />
          </button>
        </div>
      </div>
      {gallery && (
        <GalleryDialog
          branch={branch.name}
          index={photo}
          onClose={() => setGallery(false)}
        />
      )}
    </article>
  );
}
export function BranchShowcase({ onBook }: { onBook: (id: string) => void }) {
  return (
    <section className="branch-showcase container section" id="our-centres">
      <div className="branch-showcase-heading">
        <div>
          <p className="eyebrow">Выберите удобный адрес</p>
          <h2>
            ДВА АДРЕСА.
            <br />
            ОДИН АДМИРАЛ.
          </h2>
        </div>
        <p>
          Обслуживание Mercedes-Benz на Киевской и новый техцентр на Гостиничном
          проезде. Выберите точку, посмотрите фотографии и проложите маршрут.
        </p>
      </div>
      <div className="branch-showcase-grid">
        {branches.map((b) => (
          <BranchCard key={b.id} branch={b} onBook={onBook} />
        ))}
      </div>
    </section>
  );
}

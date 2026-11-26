import { telegram } from "./contact";
import { useDialogMotion } from "./dialog-motion";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { assetUrl } from "./assets";
import { branchPhotos, type BranchPhoto } from "./branch-photos";
import { branches, branchStatus, mapLink } from "./data";
import "./branch-showcase.css";
import { CrossfadeImage } from "./crossfade-image";
function GalleryDialog({
  branch,
  photos,
  index,
  onClose,
}: {
  branch: string;
  photos: BranchPhoto[];
  index: number;
  onClose: () => void;
}) {
  const { closing, dismiss } = useDialogMotion(onClose);
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
    setPhoto(
      (current) => (current + direction + photos.length) % photos.length,
    );
  return (
    <dialog
      ref={ref}
      className={`branch-gallery-dialog ${closing ? "is-closing" : ""}`}
      aria-labelledby="branch-gallery-title"
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
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
        <button aria-label="Закрыть фотографии" onClick={() => dismiss()}>
          <X />
        </button>
      </div>
      <CrossfadeImage
        src={assetUrl(photos[photo].src)}
        alt={photos[photo].alt}
      />
      <div className="branch-gallery-footer">
        <button aria-label="Предыдущее фото" onClick={() => next(-1)}>
          <ChevronLeft />
        </button>
        <span>
          {photo + 1} / {photos.length}
        </span>
        <button aria-label="Следующее фото" onClick={() => next(1)}>
          <ChevronRight />
        </button>
      </div>
    </dialog>
  );
}
function BranchCard({ branch }: { branch: (typeof branches)[number] }) {
  const photos = branchPhotos[branch.id as keyof typeof branchPhotos];
  const [photo, setPhoto] = useState(0),
    [gallery, setGallery] = useState(false);
  const categories = [...new Set(photos.map((p) => p.name))];
  const categoryPhotos = photos
    .map((p, i) => ({ ...p, index: i }))
    .filter((p) => p.name === photos[photo].name);
  const categoryIndex = categoryPhotos.findIndex((p) => p.index === photo);
  const nextInCategory = (direction: number) => {
    const next =
      (categoryIndex + direction + categoryPhotos.length) %
      categoryPhotos.length;
    setPhoto(categoryPhotos[next].index);
  };
  return (
    <article className="branch-showcase-card">
      <button
        className="branch-showcase-photo"
        onClick={() => setGallery(true)}
        aria-label={`Посмотреть фотографии: ${branch.name}`}
      >
        <CrossfadeImage
          src={assetUrl(photos[photo].preview)}
          alt={photos[photo].alt}
        />
        <span className="branch-photo-note">
          {photos[photo].name} · {categoryIndex + 1} / {categoryPhotos.length}
        </span>
        <span className="branch-photo-expand">
          <Expand size={17} />
        </span>
      </button>
      <div
        className="branch-photo-tabs"
        role="group"
        aria-label={`Фотографии техцентра: ${branch.name}`}
      >
        {categories.map((name) => (
          <button
            key={name}
            aria-pressed={photos[photo].name === name}
            onClick={() => setPhoto(photos.findIndex((p) => p.name === name))}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="branch-photo-paging">
        <button
          onClick={() => nextInCategory(-1)}
          aria-label={`Предыдущее фото: ${branch.name}`}
        >
          <ChevronLeft size={18} />
        </button>
        <span aria-live="polite">
          {photos[photo].name} · {categoryIndex + 1} из {categoryPhotos.length}
        </span>
        <button
          onClick={() => nextInCategory(1)}
          aria-label={`Следующее фото: ${branch.name}`}
        >
          <ChevronRight size={18} />
        </button>
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
            Построить маршрут
          </a>
          <a
            className="text-link"
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
        </div>
      </div>
      {gallery && (
        <GalleryDialog
          branch={branch.name}
          photos={photos}
          index={photo}
          onClose={() => setGallery(false)}
        />
      )}
    </article>
  );
}
export function BranchShowcase() {
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
          <BranchCard key={b.id} branch={b} />
        ))}
      </div>
    </section>
  );
}

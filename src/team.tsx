import { assetUrl, media } from "./assets";
import { telephone } from "./data";
import "./team.css";

const roles = [
  {
    title: "Мастер-приёмщик",
    subtitle: "Ваш контакт с техцентром",
    image: media.service,
    alt: "Иллюстрация обсуждения работ у автомобиля",
    description:
      "Помогает сформулировать задачу и согласовать работы до начала ремонта.",
    tasks: [
      "Уточняет Ваши наблюдения и историю автомобиля",
      "Обсуждает перечень работ, стоимость и сроки",
      "Объясняет результат и рекомендации при выдаче",
    ],
  },
  {
    title: "Диагност",
    subtitle: "От симптома к причине",
    image: "media/services/electrics.webp",
    alt: "Иллюстрация проверки электрических цепей автомобиля",
    description:
      "Сопоставляет ошибки, параметры и результаты проверки, чтобы определить источник неисправности.",
    tasks: [
      "Проверяет системы по Вашему обращению",
      "Работает с диагностическим оборудованием",
      "Объясняет, какие проверки и работы нужны дальше",
    ],
  },
  {
    title: "Мастера по ремонту",
    subtitle: "От обслуживания до восстановления",
    image: "media/services/engine.webp",
    alt: "Иллюстрация работы с механизмом двигателя",
    description:
      "Выполняют согласованное обслуживание и ремонт, проверяют автомобиль после работ.",
    tasks: [
      "Работают по согласованному перечню",
      "Сообщают о дополнительных замечаниях через приёмку",
      "Проверяют результат перед выдачей автомобиля",
    ],
  },
];

export function TeamSection({ preview = false }: { preview?: boolean }) {
  return (
    <section
      className={`team-section container section${preview ? " team-preview" : ""}`}
      id={preview ? "our-team" : "team"}
      aria-labelledby={preview ? "team-preview-title" : "team-title"}
    >
      <div className="team-section-heading" data-reveal>
        <div>
          <p className="eyebrow">Люди за работой техцентра</p>
          <h2 id={preview ? "team-preview-title" : "team-title"}>
            Наши сотрудники
          </h2>
        </div>
        <p>
          Знаем Mercedes-Benz и внимательно относимся к Вашей задаче. От первого
          разговора до выдачи автомобиля.
        </p>
      </div>
      <div className="team-role-grid">
        {roles.map((role) => (
          <article className="team-role-card" key={role.title} data-reveal>
            <img
              src={assetUrl(role.image)}
              alt={role.alt}
              loading="lazy"
              decoding="async"
              width="720"
              height="480"
            />
            <div className="team-role-copy">
              <p className="team-role-subtitle">{role.subtitle}</p>
              <h3>{role.title}</h3>
              <p>{role.description}</p>
              {!preview && (
                <ul>
                  {role.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="team-section-footer">
        <p>
          Иллюстрации направлений работы. Портреты и имена сотрудников добавим
          позже.
        </p>
        {preview ? (
          <a className="button secondary" href="#/about?section=team">
            Подробнее о команде
          </a>
        ) : (
          <a className="button secondary" href={telephone}>
            Обсудить с техцентром
          </a>
        )}
      </div>
    </section>
  );
}

import { useId, useState } from "react";
import { Search, X } from "lucide-react";
import { prices, searchPrices, formatPrice } from "./pricing";
import { telegram, ContactLinks } from "./contact";
export function PopularPrices() {
  return (
    <section
      className="popular-prices container section"
      aria-labelledby="popular-title"
    >
      <div className="price-section-heading">
        <div>
          <p className="eyebrow">Понятно до визита</p>
          <h2 id="popular-title">Популярные работы</h2>
        </div>
        <a className="text-link" href="#/services">
          Все услуги и цены
        </a>
      </div>
      <div className="popular-price-grid">
        {["to", "xentry", "pads", "brake-fluid"].map((id, i) => {
          const item = prices.find((p) => p.id === id)!;
          return (
            <a
              className="popular-price-card"
              href={`#/services/${item.service}`}
              key={id}
            >
              <span className="price-card-index">0{i + 1}</span>
              <h3>{item.name}</h3>
              <strong>{formatPrice(item.price)}</strong>
            </a>
          );
        })}
      </div>
      <p className="price-note">
        Стоимость работ — без запчастей и расходных материалов. Итоговую сумму
        согласуем с Вами до начала ремонта.
      </p>
    </section>
  );
}
export function PriceList({ service }: { service?: string }) {
  const [query, setQuery] = useState("");
  const id = useId();
  const items = searchPrices(query, service);
  if (service && !items.length) {
    return (
      <section className="price-list container section">
        <div className="price-section-heading">
          <div>
            <p className="eyebrow">Индивидуальные работы</p>
            <h2>Обсудим Вашу задачу</h2>
          </div>
        </div>
        <p className="service-price-explanation">
          Опишите, что Вы хотите сделать, или пришлите фотографии. Состав работ
          и стоимость согласуем с Вами до начала ремонта.
        </p>
        <ContactLinks compact />
        <a className="text-link" href="#/services">
          Посмотреть прайс на другие работы
        </a>
      </section>
    );
  }
  return (
    <section className="price-list container section" aria-labelledby={id}>
      <div className="price-section-heading">
        <div>
          <p className="eyebrow">Стоимость работ</p>
          <h2 id={id}>
            {service ? "Цены по направлению" : "Найдите нужную работу"}
          </h2>
        </div>
        <p>Выбирать модель и разбираться в категориях не нужно.</p>
      </div>
      {!service && (
        <div className="price-search">
          <Search size={21} />
          <label className="sr-only" htmlFor={`${id}-search`}>
            Найти услугу в прайсе
          </label>
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: тормозная жидкость, масло или ТО"
          />
          {query && (
            <button aria-label="Очистить поиск" onClick={() => setQuery("")}>
              <X size={19} />
            </button>
          )}
        </div>
      )}
      <p className="price-note">
        Цены «от» за работу. Запчасти и расходные материалы оплачиваются
        отдельно, подбираются по VIN. Точную стоимость согласуем до начала
        работ.
      </p>
      <div className="price-result-count" role="status">
        {query
          ? `Найдено работ: ${items.length}`
          : `${items.length} работ с открытой стоимостью`}
      </div>
      <div className="price-rows">
        {items.map((item) => (
          <article className="price-row" key={item.id}>
            <a href={`#/services/${item.service}`}>
              {item.name}
              <span>Подробнее о направлении</span>
            </a>
            <strong>{formatPrice(item.price)}</strong>
            <a
              className="price-chat"
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Обсудить в Telegram: ${item.name}`}
            >
              Обсудить
            </a>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="price-empty">
          <h3>Не нашли нужную работу?</h3>
          <p>
            Опишите задачу или пришлите фото. Мы занимаемся всеми направлениями
            ремонта Mercedes-Benz.
          </p>
          <ContactLinks compact />
        </div>
      )}
      <p className="price-note price-list-end">
        Кузовной ремонт, детейлинг, дооснащение и другие индивидуальные задачи —
        обсудите напрямую с техцентром.{" "}
        <a href={telegram} target="_blank" rel="noopener noreferrer">
          Написать в Telegram
        </a>
      </p>
    </section>
  );
}

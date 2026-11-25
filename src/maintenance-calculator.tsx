import { useState } from "react";
import { ArrowUpRight, Phone, Calculator } from "lucide-react";
import { models, telephone } from "./data";
import { whatsapp, telegram } from "./contact";
import { formatPrice } from "./pricing";
import {
  maintenanceWorks,
  estimateMaintenance,
  maintenanceDraft,
} from "./maintenance-estimate";
import "./maintenance-calculator.css";

export function MaintenanceCalculator() {
  const [mode, setMode] = useState<"scheduled" | "individual">("scheduled");
  const [selected, setSelected] = useState<string[]>(["oil"]);
  const [model, setModel] = useState("");
  const total = estimateMaintenance(mode, selected);
  const link = `${whatsapp}?text=${encodeURIComponent(maintenanceDraft(mode, selected, model))}`;
  return (
    <section className="maintenance-calculator container section">
      <a className="text-link" href="#/services">
        Услуги и прайс <ArrowUpRight size={17} />
      </a>
      <p className="eyebrow">Обслуживание Mercedes-Benz</p>
      <h1>Рассчитать ТО</h1>
      <p className="calculator-intro">
        Выберите плановое ТО или отдельные работы. Сразу покажем предварительную
        стоимость работ; запчасти и расходные материалы считаются отдельно.
      </p>
      <div className="calculator-mobile-action">
        <span>
          Работы{" "}
          <strong aria-live="polite">
            {total ? formatPrice(total) : "Выберите работы"}
          </strong>
        </span>
        {total > 0 && (
          <a href={link} target="_blank" rel="noopener noreferrer">
            Обсудить в WhatsApp <ArrowUpRight size={16} />
          </a>
        )}
      </div>
      <div className="calculator-layout">
        <div className="calculator-options">
          <label className="calculator-model">
            Ваш Mercedes{" "}
            <span>Необязательно — модель можно уточнить в переписке</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Модель для расчёта ТО"
            >
              <option value="">Выбрать модель</option>
              {models.map((item) => (
                <optgroup key={item.id} label={item.name}>
                  {item.generations.map((generation) => (
                    <option
                      key={generation}
                      value={`${item.name} ${generation}`}
                    >
                      {item.name} {generation}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <fieldset className="calculator-modes">
            <legend>Что нужно автомобилю?</legend>
            <label>
              <input
                type="radio"
                name="maintenance-mode"
                checked={mode === "scheduled"}
                onChange={() => setMode("scheduled")}
              />
              <span>
                <strong>Плановое ТО</strong>
                <small>
                  От 7 750 ₽ за работу. Состав уточняется по VIN и истории
                  обслуживания.
                </small>
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="maintenance-mode"
                checked={mode === "individual"}
                onChange={() => setMode("individual")}
              />
              <span>
                <strong>Отдельные работы</strong>
                <small>Выберите нужные замены из открытого прайса.</small>
              </span>
            </label>
          </fieldset>
          {mode === "individual" && (
            <div className="calculator-inline-total" role="status">
              <span>Выбранные работы</span>
              <strong>{total ? formatPrice(total) : "Выберите работы"}</strong>
            </div>
          )}
          {mode === "individual" && (
            <fieldset className="calculator-works">
              <legend>Выберите работы</legend>
              {maintenanceWorks.map((work) => (
                <label key={work.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(work.id)}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked
                          ? [...current, work.id]
                          : current.filter((id) => id !== work.id),
                      )
                    }
                  />
                  <span>{work.name}</span>
                  <strong>{formatPrice(work.price)}</strong>
                </label>
              ))}
            </fieldset>
          )}
        </div>
        <aside
          className="calculator-summary"
          aria-label="Предварительный расчёт"
        >
          <Calculator size={26} strokeWidth={1.4} />
          <p>Предварительная стоимость работ</p>
          <strong className="calculator-total" aria-live="polite">
            {total ? formatPrice(total) : "Выберите работы"}
          </strong>
          <p className="calculator-note">
            Без запчастей и расходных материалов. Итоговый состав и стоимость
            согласуем по Вашему автомобилю до начала работ. Плановое ТО и
            отдельные замены здесь не суммируются.
          </p>
          {total > 0 && (
            <a
              className="button"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Обсудить расчёт в WhatsApp <ArrowUpRight size={18} />
            </a>
          )}
          <a className="text-link" href={telephone}>
            <Phone size={16} />
            Позвонить в техцентр
          </a>
          <a
            className="text-link"
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Написать в Telegram <ArrowUpRight size={16} />
          </a>
          <p className="calculator-note">
            В WhatsApp откроется готовый текст с Вашим выбором. Отправку
            сообщения подтверждаете Вы.
          </p>
        </aside>
      </div>
    </section>
  );
}

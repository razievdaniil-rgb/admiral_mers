export type WorkPrice = {
  id: string;
  name: string;
  price: number;
  service: string;
  aliases: string;
};
// Prices approved by the client on 25 November 2026. Work only; parts separate.
// Source: https://elkancode.ru/admiral-mercedes-msk/
export const prices: WorkPrice[] = [
  {
    id: "to",
    name: "Техническое обслуживание Mercedes-Benz",
    price: 7750,
    service: "maintenance",
    aliases: "ТО регламент сервис обслуживание",
  },
  {
    id: "oil",
    name: "Замена масла и масляного фильтра двигателя",
    price: 3150,
    service: "maintenance",
    aliases: "моторное масло ТО",
  },
  {
    id: "xentry",
    name: "Компьютерная диагностика Xentry",
    price: 3700,
    service: "diagnostics",
    aliases: "ошибка чек check engine сканер",
  },
  {
    id: "suspension",
    name: "Диагностика подвески",
    price: 3500,
    service: "suspension",
    aliases: "ходовая стук скрип",
  },
  {
    id: "engine",
    name: "Диагностика двигателя",
    price: 7400,
    service: "engine",
    aliases: "мотор троит дым вибрация",
  },
  {
    id: "endoscopy",
    name: "Эндоскопия двигателя",
    price: 10000,
    service: "engine",
    aliases: "цилиндры задиры мотор",
  },
  {
    id: "alignment",
    name: "Регулировка развала-схождения",
    price: 9000,
    service: "suspension",
    aliases: "развал схождение увод колеса",
  },
  {
    id: "pads",
    name: "Замена тормозных колодок · 2 шт.",
    price: 4550,
    service: "suspension",
    aliases: "тормоза скрип",
  },
  {
    id: "discs",
    name: "Замена тормозных дисков и колодок · 2 шт.",
    price: 7000,
    service: "suspension",
    aliases: "тормоза биение",
  },
  {
    id: "shocks",
    name: "Замена передних или задних амортизаторов · 2 шт.",
    price: 8000,
    service: "suspension",
    aliases: "стойки подвеска ходовая",
  },
  {
    id: "air",
    name: "Калибровка пневмоподвески",
    price: 7400,
    service: "suspension",
    aliases: "пневма airmatic ходовая",
  },
  {
    id: "atf",
    name: "Замена масла в АКПП",
    price: 11000,
    service: "transmission",
    aliases: "автомат коробка трансмиссия",
  },
  {
    id: "cvt",
    name: "Замена масла в вариаторе или роботизированной КПП",
    price: 10000,
    service: "transmission",
    aliases: "робот коробка cvt dct трансмиссия",
  },
  {
    id: "diff",
    name: "Замена масла в переднем или заднем редукторе",
    price: 3500,
    service: "transmission",
    aliases: "дифференциал трансмиссия",
  },
  {
    id: "transfer",
    name: "Замена масла в раздаточной коробке",
    price: 4200,
    service: "transmission",
    aliases: "раздатка 4matic трансмиссия",
  },
  {
    id: "filter",
    name: "Замена воздушного или салонного фильтра",
    price: 1400,
    service: "maintenance",
    aliases: "ТО фильтры салон",
  },
  {
    id: "fuel",
    name: "Замена топливного фильтра",
    price: 7000,
    service: "maintenance",
    aliases: "ТО топливо фильтры",
  },
  {
    id: "plugs",
    name: "Замена свечей зажигания · 4 шт.",
    price: 5250,
    service: "maintenance",
    aliases: "ТО свечи",
  },
  {
    id: "brake-fluid",
    name: "Замена тормозной жидкости",
    price: 5250,
    service: "suspension",
    aliases: "ТО тормоза тормозная жидкость обслуживание",
  },
  {
    id: "coolant",
    name: "Замена антифриза",
    price: 6200,
    service: "maintenance",
    aliases: "ТО охлаждающая жидкость охлаждение",
  },
  {
    id: "belt",
    name: "Замена комплекта приводного ремня",
    price: 6200,
    service: "engine",
    aliases: "ремень ролики мотор",
  },
  {
    id: "tires",
    name: "Шиномонтаж · 4 колеса",
    price: 6500,
    service: "suspension",
    aliases: "шины резина переобуть балансировка",
  },
  {
    id: "roof",
    name: "Обслуживание складной крыши",
    price: 9000,
    service: "body",
    aliases: "кабриолет SL SLK родстер",
  },
  {
    id: "radiators",
    name: "Мойка радиаторов с разбором кассеты",
    price: 18000,
    service: "engine",
    aliases: "охлаждение перегрев чистка",
  },
  {
    id: "intake",
    name: "Очистка впуска дизельного двигателя ореховой скорлупой",
    price: 30000,
    service: "engine",
    aliases: "дизель нагар коллектор чистка",
  },
  {
    id: "start-stop",
    name: "Отключение системы старт-стоп",
    price: 25000,
    service: "electrics",
    aliases: "start stop кодирование электроника",
  },
];
export const formatPrice = (price: number) =>
  `от ${price.toLocaleString("ru-RU")} ₽`;
const normalize = (text: string) =>
  text.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
export function searchPrices(query: string, service = "") {
  const tokens = normalize(query).match(/[\p{L}\p{N}]+/gu) || [];
  return prices.filter((work) => {
    if (service && work.service !== service) return false;
    const haystack = normalize(`${work.name} ${work.aliases}`);
    const words: string[] = haystack.match(/[\p{L}\p{N}]+/gu) || [];
    return tokens.every((token) =>
      token.length <= 2 ? words.includes(token) : haystack.includes(token),
    );
  });
}

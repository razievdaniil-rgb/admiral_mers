# Раскрытие внутренних узлов автомобиля

Референс взаимодействия: https://horizonx.so/explore/real-estate-sketch-hero — мягкая линза под курсором, показывающая альтернативный слой. Реализован собственный компонент `XrayImage`; исходники платного шаблона не использованы.

## Поведение

- На компьютере линза следует за указателем с небольшим плавным отставанием. Уход курсора закрывает разрез.
- Кнопка «Показать внутренности» раскрывает весь слой и фиксирует его; повторное нажатие возвращает кузов. Escape также возвращает кузов.
- На сенсорном экране доступны кнопка и короткое нажатие на автомобиль; прокрутка и перетаскивание увеличенной машины не считаются нажатием.
- В каталоге прежний разрез закрывается при смене модели. Кнопки разреза и приближения находятся вне перемещаемого/масштабируемого изображения.
- При reduced-motion линза не следует за курсором, переключение кнопкой мгновенное. Кадры requestAnimationFrame выполняются только пока меняются координаты/радиус, при размонтировании отменяются.
- Пока альтернативное изображение не загрузилось, наружный кузов остаётся видимым.

## Изображения

Созданы встроенным image_gen, с сохранением исходных изображений Figma. Это художественные иллюстрации устройства, а не схемы точной комплектации. В интерфейсе есть подпись и описание для скринридера.

Финальные WebP со слоем прозрачности:

- `public/media/xray/hero-v2.webp` — главный экран, исходный размер 1335×701.
- `public/media/xray/e.webp` — E W213, 1109×330.
- `public/media/xray/s.webp` — S W222, 1572×404.
- `public/media/xray/gle.webp` — GLE/ML W166, 1600×470.

Оптимизированы для локальной загрузки, суммарно около 600 КБ. Полноразмерные PNG сохранены отдельно в каталоге generated_images Codex; на сайте используются только локальные WebP.

## Набор запросов для генерации

Для каждой модели применялся отдельный запрос к её исходному изображению:

> Use case: precise-object-edit. This reference is the exact edit target for a website X-ray hover reveal. Create ONE photorealistic technical cutaway layer of THIS SAME car. Preserve the exact canvas framing, camera perspective, wheel centers, wheelbase, outer silhouette, size and placement pixel for pixel so it can be overlaid on the reference without motion or resizing. Make the painted body panels nearly transparent smoked glass and expose detailed metallic engine, transmission, drivetrain, brake discs, suspension, chassis structure and interior seats in their plausible physical positions. Elegant silver and graphite mechanics, restrained ice-blue accents on wiring only, high contrast on transparent background. Keep the wheels in exactly their existing positions but show the mechanical brake discs. Do NOT change the car's pose or camera. Do NOT add floor, background, labels, text, arrows, scan lines or effects. No exploded parts floating outside the silhouette. The goal is a premium realistic see-through automotive cutaway, not a neon wireframe or a blueprint. Transparent alpha background required.

Уточнения ракурса: side profile sedan facing left (E); side profile long luxury sedan facing left (S); side profile SUV coupe facing left (GLE).

Главный экран дополнительно уточнён с двумя референсами — оригиналом и первым разрезом:

> Image 1 is the ONLY geometry and framing master. Image 2 is a mechanics-material reference ONLY; do not copy its camera angle or body proportions. Edit Image 1 in place: selectively replace its silver hood and door skins with a photorealistic see-through cutaway exposing the engine, seat structure, springs and chassis. LOCK the exact original wheels, tire outlines, wheel-center positions, grille, headlights, windscreen, mirrors, outer body outline, size and position from Image 1. Absolutely no camera change or redrawing the car into a more frontal view. The original near front wheel center is approximately x=41%, y=62% of the entire original canvas; the distant rear wheel is approximately x=15%, y=48%. Keep those anchors exact. Keep the original empty canvas and original reflection below the car where possible. Paint the internal machinery only INSIDE the existing body panels. Silver metallic mechanism and subtle cool wiring; no text, labels or background. This is an aligned overlay editing task, not a new rendering of a similar car.

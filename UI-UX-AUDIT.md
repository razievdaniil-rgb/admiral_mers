# Typography and spacing audit — 25 November 2026

Reviewed the homepage, service price list and catalogue, service detail, About, contacts and maintenance calculator using the native browser at desktop and mobile sizes. Applied the frontend-design skill to the established monochrome direction.

## Findings and changes

- Page and section headings previously had almost identical sizes in Services. About mixed heading weights from 500 to 750. Unified Manrope headings at weight 550 with explicit page / section / card roles: 40 / 32 / 24 px on desktop, 36 / 28 / 24 on short desktop screens, 32 / 28 / 24 on mobile. The existing homepage hero retains its responsive sizing so its offer fits.
- Body and control typography uses local Inter; defined the previously unresolved `--body` token. Introductions use 16 px with 1.5 line height, with the compact mobile calculator introduction at 15 px. Important calculator and price disclaimers no longer drop to 10–11 px; secondary information uses 12–13 px. Price names on mobile increased from 13 to 15 px, search text to 16 px.
- Introduced a four-pixel spacing vocabulary: 4, 8, 12, 16, 24, 32, 48. Normalised shared intro margins, heading groups, price rows, cards, calculator choices, history, hospitality gallery and contact actions. Border widths, optical adjustments and viewport-driven hero dimensions remain independent of the spacing scale.
- Price figures use tabular numerals. Consistent line heights and weights clarify amounts, service names and secondary links. Shortcut controls have a shared 40 px minimum height.
- Preserved the visible catalogue, illustrated hover cutaway, direct contacts, price search and calculator behaviour. Moved the mobile SUV up within its existing allocation so its wheels do not cover the price cards.

## Validation

Production build and the existing ten functional / asset checks. Native browser review at 1366 × 650 and 390 × 844 checks readable type, horizontal overflow, first-screen contact actions, calculator options and unchanged homepage fit. No new fonts, libraries or runtime animation loops.

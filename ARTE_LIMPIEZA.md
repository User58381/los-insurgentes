# Botes y residuos orgánicos e inorgánicos

Asset final: `assets/limpieza-sprites.png`, PNG RGBA de 1536 × 1024 con
transparencia real. Se editó con ImageGen integrado a partir del atlas de v12.

| Bote | Color | Residuo | Recorte del bote: x, y, ancho, alto | Recorte del residuo |
| --- | --- | --- | --- | --- |
| Orgánica · Cáscaras | Verde | Cáscara de plátano | 90, 41, 401, 659 | 92, 712, 399, 268 |
| Inorgánica · Envases | Amarillo | Botella de plástico | 567, 41, 398, 659 | 590, 707, 337, 285 |
| Inorgánica · Envolturas | Azul | Envoltura de plástico | 1045, 41, 401, 659 | 1064, 712, 394, 273 |

Los recortes están en SchoolPlayground.CLEANUP_FRAMES. Los letreros se dibujan
en dos líneas, mostrando la categoría y el tipo de residuo. Se conservan las
posiciones de los botes, los nueve residuos, el traslado en la mano, la
trayectoria al depositar, el brillo al acertar y el sonido START original.

Prompt final utilizado, modo integrado:

> Use case: precise-object-edit. Asset type: production pixel-art sprite atlas for the existing Los Insurgentes school cleanup game. Edit the attached atlas to teach organic versus inorganic waste. Preserve the detailed crisp chunky pixel-art style, the three OPEN wheelie bins with large dark open mouths for the deposit animation, same three-column/two-row composition, front three-quarter view, consistent sprite sizes and large transparent gutters. EXACTLY SIX isolated objects, NO background and NO glow or floor or cast shadows outside the objects, genuine transparent alpha. Canvas 1536x1024 landscape if possible. Top row has three open bins entirely contained near these source areas: left x126..457 y88..666, center x603..933 y88..666, right x1082..1413 y88..666. Bottom row three separate litter sprites: left around x150..402 y726..954, center around x618..915 y709..961, right around x1083..1428 y722..961. CHANGE ONLY THESE CONTENT DETAILS: the LEFT bin becomes rich GREEN, with a clear white banana-peel silhouette emblem, and the bottom-left crumpled paper is replaced with an unmistakable discarded yellow BANANA PEEL, open empty peel with 3 curled flaps, absolutely no edible fruit inside. The CENTER bin stays YELLOW with its bottle emblem, and keep the cyan blue-capped plastic water bottle below it. The RIGHT bin becomes BLUE, keeping its white wrapper emblem, with the orange/red empty snack wrapper below it. No written text anywhere; all labels will be rendered by the game. No recycling-arrows symbol on the organic bin. Do not add characters, faces, extra bins, extra litter, decorative scenery, panels, glows or gradients on the background. Every object must be fully separated, fully visible with no clipping, and sufficiently large for clear small game sprites. This is an actual transparent sprite atlas, not a poster or screenshot.

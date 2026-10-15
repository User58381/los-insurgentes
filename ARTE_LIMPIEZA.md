# Botes y residuos de la explanada

El juego carga `assets/limpieza-sprites.png`, un atlas PNG RGBA de 1536 × 1024
con fondo transparente. Contiene tres botes abiertos y tres residuos. Los
recortes están definidos en `SchoolPlayground.CLEANUP_FRAMES` dentro de
`playground-engine.js`; el dibujo y la animación están en `playground-ui.js`.

| Tipo | Bote | Residuo | Recorte del bote: x, y, ancho, alto | Recorte del residuo |
| --- | --- | --- | --- | --- |
| Papel | Azul | Papel arrugado | 126, 88, 331, 578 | 150, 726, 252, 228 |
| Envases | Amarillo | Botella de agua | 603, 88, 330, 578 | 618, 709, 297, 252 |
| Otros | Verde | Envoltura | 1082, 88, 331, 578 | 1083, 722, 345, 239 |

Los nombres se dibujan en el juego para mantenerlos legibles. Cada residuo se
ve en el suelo, junto al personaje al recogerlo y durante su trayectoria al
bote. El bote correcto se ilumina al recibirlo. El último depósito termina
su animación antes de mostrar el resultado. La pausa congela la animación.

Se creó este atlas con ImageGen, en modo integrado. Prompt de producción:

> Use case: stylized-concept. Asset type: one production sprite atlas PNG for
> a warm, polished 16-bit top-down school RPG, three-quarter overhead view
> with front faces visible, consistent soft pixel clusters, dark forest-brown
> outlines and small pixel highlights. Transparent landscape 1536 × 1024,
> three columns and two rows with separate, fully visible objects. Top row:
> blue open paper wheelie bin, yellow open plastic bottle wheelie bin, green
> open general litter wheelie bin. Bottom row: crumpled paper, cyan water
> bottle, red-orange wrapper. Leave transparent space around each object;
> no text, grid, people or environment. Finished reusable sprites for the
> existing school courtyard game.

Las canciones y efectos se conservan aparte. El sonido de cada depósito
correcto reutiliza `assets/audio/start-106.wav`, recibido para el juego.

# Ensayo en el teatro con el maestro Ángel

Versión `20261012-ensayo-teatro-1`.

## Cómo jugar

Acércate a las escaleras del teatro, al oeste de la explanada. El marcador de
música señala la entrada al ensayo. Pulsa **Enter o A** para ver la invitación:
“¿Quieres ensayar una canción en el teatro con el maestro Ángel?”.

El alumno que estás controlando canta en el coro. Hay **seis alumnos cantando**,
**21 alumnos como público**, el maestro Ángel tocando la guitarra, y los otros
16 personajes del personal reunidos en la explanada, incluido el director José
Guadalupe. Los alumnos conservan el uniforme del día y su identidad en la lista.

- **Flechas**: toca cuando la flecha móvil coincida con su marca de arriba.
- **Enter**: empezar, confirmar y abrir la pausa durante la canción.
- **En pausa**: flechas para elegir continuar o regresar; Enter para confirmar.
- **Xbox**: cruceta o joystick para las cuatro flechas; A para confirmar,
  START para pausa y B para volver a la explanada.
- **Teléfono**: cuatro botones de flechas, Pausa y Explanada.
- **WASD**, **P** y **Esc** también funcionan.

“Ensayo tranquilo” tiene 168 flechas y “Reto del ritmo” tiene 335. El ensayo dura
los **2 minutos y 36 segundos completos** de la canción enviada. No se corta al
fallar. Al terminar muestra aciertos, precisión, puntuación y mejor racha.

Si escuchas con Bluetooth y notas retraso, cambia **Ajuste del ritmo** antes de
empezar o desde la pausa. Izquierda y derecha modifican el ajuste en pasos de
50 ms, hasta 250 ms antes o después. No cambia la velocidad de la música.

## Audio y sincronización

El MP3 suministrado se copió **sin conversión ni recortes** a
`assets/audio/ensayo-teatro.mp3` (3,595,402 bytes). El audio decodificado dura
156 segundos; el contenedor declara 156.024 segundos.

El mapa de pulsos proviene del análisis de los ataques de la propia grabación.
Se calculó flujo espectral en tres bandas, autocorrelación y un ajuste de tempo
y fase a lo largo de toda la canción; cada pulso se acercó al ataque detectado.
El pulso de referencia estimado es de aproximadamente 131.93 BPM. El mapa tiene
336 pulsos; el juego comienza a pedir flechas después de los primeros 3 segundos.
No se afirma que sea una transcripción musical manual.

Las flechas y los aciertos usan `audio.currentTime` como reloj. El tiempo no se
acumula a partir de los cuadros de animación, por lo que una bajada de FPS no
provoca una deriva de la canción. La pausa detiene el MP3 y los juicios. Al cambiar
de pestaña se pausa y se requiere continuar explícitamente. Al cargar lento,
las flechas esperan al audio. La pantalla final espera el evento `ended` real.

El modo tranquilo admite 250 ms de margen; el reto, 190 ms. Los grados de acierto
son Perfecto, Muy bien y Bien. Una tecla mantenida no repite golpes; un toque
no puede consumir una misma nota dos veces. No hay flechas simultáneas ni vidas
que interrumpan el ensayo. Los mensajes de acierto se dibujan sobre las marcas,
sin cubrir flechas entrantes.

Mientras está abierto el teatro, se detiene la música del patio. Al salir se
reanuda y el alumno sigue en el mismo lugar. El ensayo tiene récords por modo y
ajuste propio en `insurgentes-theater-record-v1`. Los guardados de etiquetas y
maestros, estrellas y puntos de la aventura se conservan.

## Archivos nuevos

- `theater-song.js`: mapa de pulsos, archivo de canción y coordenadas del atlas.
- `theater-engine.js`: juicios, puntuación, pausa y dibujo de las flechas.
- `theater-ui.js`: reproducción, controles y escena del coro y espectadores.
- `assets/angel-guitarra.png`: cuatro poses con fondo transparente.
- `assets/teatro-ensayo.png`: fondo del teatro vacío, con escalones a la derecha.
- `assets/audio/ensayo-teatro.mp3`: canción completa proporcionada.

El resto del mapa, las fotos/sprites anteriores y las canciones anteriores no
se sustituyen. El teatro se distingue del reto de Oliver por la distancia al
personaje o a las escaleras.

## Arte y prompts

Se usó la herramienta integrada **imagegen**, con referencias locales del
maestro Ángel y del mapa. Se copiaron las salidas a los nombres anteriores,
conservando el alfa de la hoja de guitarra. El juego recorta cada pose con sus
coordenadas y la alinea por los pies. Los alumnos y profesores se dibujan usando
sus atlas existentes. Las notas musicales, flechas y efectos son gráficos de
Canvas que pueden animarse con el reloj del audio.

### Maestro Ángel con guitarra

Referencia: `assets/maestro-angel.png`. Fondo transparente. Prompt:

Use case: identity-preserve. Asset type: a transparent 2 by 2 animation sprite sheet for a pixel-art school RPG. Edit the supplied Maestro Ángel character sheet: replace the four directional poses with FOUR FRONT-FACING GUITAR-PLAYING ANIMATION POSES, keeping the SAME recognizable teacher identity: warm tan skin, swept-up brown hair, brown full beard, large friendly dark eyes, red polo shirt, khaki trousers, brown and cream sneakers. Each complete character holds the same warm honey-brown acoustic guitar across his torso, neck pointing toward his left (image right); his left hand holds the fretboard and right hand changes only between a low strum, a high strum, a mid strum, and a small smiling singing pose. Same body scale, face, guitar, feet placement and baseline in all four frames. Arrange exactly four fully separate sprites in a regular TWO ROWS BY TWO COLUMNS grid with large transparent gutters; no overlap or clipping; each sprite centered in its equal cell. Match the crisp detailed chunky square pixels, dark outlines and colorful shading of the reference, like a beautiful handheld RPG. Truly transparent alpha background, no black or white matte, no text, no labels, no floor, no musical notes baked into the sprite, no cast shadows. This is game animation art, not a presentation.

### Fondo del teatro

Referencia: `assets/mapa.png`. Fondo opaco. Prompt:

Use case: stylized-concept. Asset type: pixel-art backdrop for a playable school music rehearsal. Reimagine ONLY the little outdoor theater visible on the LEFT side of the reference school map as a closer, beautifully detailed landscape scene seen from a moderately elevated front view, as in a polished colorful handheld 2000s RPG. Match the actual school architecture: a simple orange freestanding BACK WALL framed with BLUE trim, a broad low raised rectangular stage with pale cream concrete tiled floor, small steps at the RIGHT, NO roof or canopy. Tall lush green school trees at the outer edges, orange classrooms with blue doors and cream roofs visible behind the stage, warm sunny sky at the very top. The backdrop must have EMPTY SPACE for game characters: stage occupies the central upper half, front wall around y=15 to 31 percent, a broad clear stage floor y=31 to 56 percent. The lower 44 percent is the wide gray square-tiled EXPLANADA, flat and empty for rows of spectators. The whole stage is visible from x=14 to x=87 percent; trees may frame its edges but must not obscure the middle. Level front of stage and broad audience area. Crisp individual pixel blocks, rich painterly pixel shading, warm peach and cream stone, deep emerald foliage, blue and orange accents; magical, inviting school-day atmosphere, careful pixel texture. LANDSCAPE 3:2 composition. NO people, NO teacher, NO students, NO chairs, NO instruments, NO arrows, NO game HUD, NO text, NO letters, NO signage, NO watermark. Leave the entire stage and central plaza uncluttered so the game can animate teachers and children there. Preserve the recognizable simple blue-orange school theater, not a grand concert hall.

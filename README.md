# Los Insurgentes · La aventura del saber — v14

Versión normal completa basada en **Los_Insurgentes_GitHub_v13.zip**. Conserva
los 27 alumnos con nombre, los 17 personajes seleccionables del personal, sus animaciones,
el arte, las canciones, el editor y todos los minijuegos.

## Nuevas misiones de los maestros

| Docente | Misión |
| --- | --- |
| Maestro Ángel, dentro del salón | Dibujo con cubeta: 12 zonas, 6 claves de color y 90 segundos |
| Teacher Raúl | Seis actividades visuales de colores y útiles en inglés |
| Maestra Cesia | Limpiar el salón después de comer en el recreo |
| Maestra Diana | Practicar el hábito de dejar limpio el salón al volver del recreo |
| Maestra Angélica | Ocho tarjetas con imágenes del uniforme y respuestas Verdadero/Falso |
| Maestro Luis Miguel y maestra Norma | Puntualidad: entrada a las 8:00 a. m., salida a las 12:30 p. m. y buenos hábitos |

Acércate al docente y pulsa **Enter / A** para leer su invitación. Las actividades
también aparecen en **Mapa → Misiones de los maestros**. Para el dibujo debes
entrar al salón jugable y hablar con Ángel. El grupo y su puerta siguen los ajustes
del editor. El dibujo usa la **canción original de Criss y su sonido de contador**.

Mueve la cubeta con flechas/palanca y rellena la figura completa con Enter/A.
Puedes elegir el color tocando la paleta del lienzo con la cubeta y pulsando A,
con los botones de color, con **1–6**, con **Z/X**, o con **LB/RB** del mando.
Una selección equivocada se puede corregir. La pausa detiene reloj y movimiento;
al llegar a cero termina el intento sin otorgar el logro. En teléfono también
puedes tocar directamente una figura para rellenarla con el color elegido.

La limpieza de salón mantiene la dinámica de Criss: tres botes, nueve residuos,
90 segundos, separación orgánica/inorgánica y el mismo sonido por depósito.
Se diferencia de la explanada por su ambiente, docente y explicación del hábito.
El uniforme usa los sprites originales de cada día y permite el uniforme blanco
y de cuadros como alternativa del martes, igual que la guía existente.

Hay **seis nuevos logros**, cada uno con 80 puntos la primera vez. Luis Miguel
y Norma comparten una misión y su logro; Cesia y Diana tienen retos propios.
Las preguntas permiten corregir y continuar después de leer la explicación.
Se conservan los controles Enter=A, espacio=B, E=pausa y los guardados anteriores.
Ver detalles en `MISIONES_DOCENTES.md` y `VERIFICACION_V14.txt`.

## Limpieza orgánica e inorgánica y selector

El selector ofrece **44 personajes**: 27 alumnos y 17 integrantes del personal.
El velador ya no aparece en Todos, Personal ni en los resultados de búsqueda.
Los guardados anteriores siguen siendo compatibles y conservan su progreso.

Criss conserva la misma jugabilidad: **3 botes, 9 residuos y 90 segundos**.
Los botes mantienen sus posiciones y la recogida, el traslado, el depósito,
las animaciones, el sonido START por acierto y el contador funcionan como antes.

| Bote | Dibujo | Qué recoge |
| --- | --- | --- |
| Orgánica · Cáscaras | Verde, cáscara de plátano | Restos de fruta |
| Inorgánica · Envases | Amarillo, botella | Botellas de plástico |
| Inorgánica · Envolturas | Azul, envoltura | Envolturas de plástico |

Los dos últimos botes pertenecen a la categoría **inorgánica**; sus dibujos
ayudan a separar los dos tipos de objetos. Criss explica la diferencia y los
mensajes al recoger o equivocarse recuerdan por qué corresponde ese residuo.
La cáscara sustituye al papel del minijuego anterior. No se añaden preguntas ni
pasos al reto. Las recompensas y los logros guardados se conservan.

Se incluye una actualización pequeña para **v11, v12 o v13**, con todos los archivos
de código y el atlas de limpieza nuevo. Se copia sobre la carpeta existente,
aceptando reemplazar archivos y conservando las imágenes y canciones restantes.
El ZIP completo incluye todo para instalarlo desde cero. Lee `ACTUALIZAR.txt`.

## Salones y teclado actualizados

La distribución recibida en `Escuela_Los_Insurgentes.json` queda incorporada por
defecto. Los 10 salones de la fila superior, de izquierda a derecha, son:
**4.º A, 1.º B, 6.º B, 5.º A, 5.º B, 3.º B, 4.º B, 2.º A, 2.º B y 3.º A**.
Los demás edificios mantienen las etiquetas del mismo JSON. Los 12 docentes
de grupo se colocan frente a su salón; sus asignaciones y los cargos se conservan.

**Enter es A**, **espacio es B** y **E es pausa**. Las flechas sirven para
moverte y elegir opciones. Enter actúa al pulsarlo. Mantén espacio para correr
en el patio; en los menús y minijuegos vuelve o sale, igual que B del mando.
E abre/cierra la pausa y el mapa del patio, y pausa/reanuda cada minijuego,
incluido el trompo. Se conservan las crucetas táctiles y los mandos Xbox.

Al actualizar, la distribución anterior de fábrica se cambia automáticamente.
Si habías personalizado los salones, se respetan: puedes aplicar esta distribución
en **Editar escuela → Salones y edificios → Usar salones de esta versión**.
Esto conserva las asignaciones de maestros, estrellas, puntos y récords.
También puedes importar el JSON incluido. En los campos de texto, espacio y E
siguen sirviendo para escribir.

Verificación de esta entrega en `VERIFICACION_V14.txt`; se conservan los informes anteriores.

## Pasos animados para todo el personal

- Los **17 personajes seleccionables del personal**, incluidos los maestros, Criss, Claudia,
  Mauricio y el director, mueven los pies al usarlos como jugador.
- Hay pasos alternados de frente, de espalda y hacia ambos lados. Cada sprite
  propio tiene ajustes para sus piernas, zapatos y ropa. El cabello, el torso,
  los vestidos y los abrigos conservan su forma.
- El ritmo sigue la distancia recorrida: acelera al correr y se detiene cuando
  el personaje deja de avanzar. Los adultos mantienen su altura al girar.
- La animación también se usa al desplazarse como portero en fútbol y al
  caminar y llevar residuos durante la limpieza. La pausa deja quietos los pies.
- Se conserva el ajuste del dispositivo para reducir movimiento.

Detalles y alcance en `ANIMACION_PERSONAL.md` y `VERIFICACION_V11.txt`.

## Canciones, regreso de la música y nuevos botes

- La primera canción recibida suena en los tres retos de fútbol de Daniel,
  Alexis y Joaquín: `assets/audio/futbol.mp3` ← `星のオルガン.mp3`.
- La segunda suena en la cuerda de Dalila:
  `assets/audio/cuerda-dalila.mp3` ← `27245625y4.mp3`.
  Ambas se repiten durante su partida y conservan los archivos originales.
- Al salir del teatro, Pac-Man, trompo o los retos del patio se recupera la
  música del lugar. Si el navegador interrumpe un intento de reproducción,
  el reproductor vuelve a intentarlo automáticamente. Se respeta el botón
  de silencio y las pausas al cambiar de pestaña o abrir el editor.
- Limpieza incluye botes abiertos verdes, amarillos y azules, cáscaras, botellas
  y envolturas con fondo transparente. Ves el residuo mientras lo llevas y
  cómo entra al bote al acertar. Cada depósito correcto usa el WAV original
  de START de Los Insurgentes, `assets/audio/start-106.wav`.
  Recoger o equivocarse no dispara ese sonido. Detalles del arte en
  `ARTE_LIMPIEZA.md`.

## Limpieza con Criss: diálogo, música y cuenta regresiva

1. Busca a **Criss a la derecha de la explanada**. Su globo dice:
   «¿Me ayudas a limpiar la explanada?». Pulsa Enter / A para hablar con ella.
2. Criss explica la misión. **¡Sí, te ayudo!** desbloquea el reto y lo inicia.
   **Después**, espacio, Escape o B te devuelven al patio sin desbloquearlo.
3. Hay **90 segundos** para separar los 9 residuos. El contador muestra minutos
   y segundos. Suena el WAV recibido cada segundo; durante los últimos **10**,
   el reloj cambia de color y el aviso suena cada medio segundo, más agudo.
4. Suena el MP3 recibido durante la partida de limpieza. La pausa o salir de la
   pestaña detienen el juego y la música. Al continuar retomas la cuenta; al
   volver al patio regresa su música. El botón ♫ del reto respeta el sonido global.
5. Al llegar a **0:00**, el reto termina sin dar la recompensa. Puedes intentarlo
   otra vez. Una victoria conserva los **80 puntos de la primera vez**.
6. Tras hablar y aceptar, el mapa permite abrir la limpieza directamente. El
   desbloqueo se conserva en el guardado automático y en la copia completa.
   Si ya habías ganado este reto en v8, continúa desbloqueado al actualizar.

Se incluyeron los archivos recibidos, sin recortar ni recodificar:
`assets/audio/limpieza-criss.mp3` ← `3645646435643.mp3`, y
`assets/audio/contador-criss.wav` ← `OOT_Countdown2.wav`.
Las músicas de fútbol, cuerda y limpieza ya están incluidas.

## Novedades

- Selector con **44 personajes**: 27 alumnos y 17 miembros del personal, incluido
  el director. Fondo de la escuela, vista grande, giro, filtros y búsqueda.
  Se abre al comenzar; también puedes cambiar de personaje desde el mapa sin
  perder estrellas. El personal sin retrato propio usa una figura genérica.
- Daniel y Alexis tiran; tú eres portero. Cada atajada suma para ti y cada gol
  suma para el compañero. Gana quien llegue primero a 3. Alexis tira más rápido.
- Joaquín es el portero; apunta y marca 3 goles antes de que él consiga 3 atajadas.
- Dalila: consigue 10 saltos de cuerda, con 3 oportunidades y una señal dorada.
- Criss: recoge 9 residuos de la explanada y llévalos a Orgánica, Inorgánica: envases o Inorgánica: envolturas.
  Hay 90 segundos. Una clasificación equivocada permite corregirla.
- Cada reto nuevo da **80 puntos la primera vez**. Puedes repetirlo para practicar.
- Progreso automático: personaje, posición, estrellas, puntos, goles, día, pregunta
  pendiente y retos conseguidos. Los ajustes y récords de la v7 siguen usando sus
  claves originales. Hay una copia anterior para recuperar una partida dañada.

## Subir a tu GitHub Pages

1. Descomprime el ZIP y abre `Los_Insurgentes_GitHub`.
2. Reemplaza **todo su contenido** en la raíz de `User58381/los-insurgentes`,
   donde está `index.html`. Incluye **version.json y todos los archivos nuevos**.
   Conserva `assets/` con su estructura. Sube los archivos descomprimidos.
3. Guarda en `main` y espera a que termine la publicación de GitHub Pages.
4. Abre la dirección habitual: https://user58381.github.io/los-insurgentes/

Desde esta versión, el juego comprueba actualizaciones al abrir, al recuperar
la conexión, al volver a la pestaña y aproximadamente cada minuto. Cambia la URL
solo de los recursos modificados: las imágenes y canciones iguales reutilizan
su caché. Si estás en un reto, pregunta, menú o editor, espera a que vuelvas al
juego. Primero guarda la partida; si no puede guardarla, pospone la recarga.
No elimina datos del navegador, ajustes, récords ni cachés de otros juegos.
La primera instalación de v8 requiere que el navegador reciba esta versión;
una copia antigua de v7 que ya estaba abierta no tiene este comprobador.

Para futuras ediciones del código, ejecuta `python3 preparar_version.py` antes
de subir el paquete completo. Esto calcula las versiones sin dependencias.
**Buscar actualización** en el editor permite comprobarla de inmediato.
Una carga parcial no se aplica si `index.html` y `version.json` no coinciden.

## Dónde jugar y cómo guardar una copia

Los tres retos de fútbol están con sus personajes en la cancha. Dalila y Criss
están en la explanada. Acércate y pulsa **Enter / A**. También puedes abrir los
retos desde **Mapa → Juega con tus compañeros**; la limpieza requiere hablar
primero con Criss.

En **Mapa → Tu partida → Guardar copia completa** se descarga un JSON con todos
los avances, ajustes y récords. **Restaurar copia** sirve para llevarlo a otro
navegador o equipo. El editor conserva su exportación anterior de solo ajustes.
Los guardados son de cada navegador; no se sincronizan entre teléfonos.
Recargar manualmente durante un minijuego permite retomarlo desde su entrada;
los retos completados y puntos ya concedidos sí se conservan. La actualización
automática espera a que salgas del minijuego.

Para jugar con una copia descargada, descomprime todo y abre `index.html`.
Las actualizaciones automáticas funcionan en el juego publicado por HTTP/HTTPS.

## Controles de los retos nuevos

| Acción | Teclado | Xbox | Teléfono |
| --- | --- | --- | --- |
| Mover / apuntar | Flechas o WASD | Joystick / cruceta | Flechas del reto |
| Tirar, estirarte, saltar, recoger | Enter | A | Botón A del reto |
| Pausa / seguir | E (también P) | START | Pausa / Seguir |
| Volver al patio | Espacio (también Escape) | B | Patio |

El selector acepta flechas o cruceta, Enter / A para confirmar y espacio / B
para volver. En el patio: espacio / B para correr y E / START para pausa y mapa.
También se conservan Shift para correr, M / X para mapa y Y del mando para sonido.

## Verificación de v9

Las pruebas de lógica e integración están en `tests/`. Ejecuta:
`node --test tests/*.cjs`.
La integración usa un DOM simulado y mando sintético. No sustituye una prueba
visual en navegador ni una prueba física en Android o Xbox.

## Ensayo musical en el teatro

Acércate a las escaleras del teatro a la izquierda de la explanada y pulsa
**Enter o A**. El maestro Ángel toca la guitarra, seis alumnos cantan y los
demás alumnos, profesores y director observan desde la explanada.
Si eliges a un miembro del personal, también puede formar parte del coro.

Toca **izquierda, abajo, arriba o derecha** cuando la flecha llegue a la marca.
La canción enviada suena completa: **2:36**. Hay un ensayo tranquilo, un reto
con más flechas, precisión, rachas y récords por modo. Fallar permite seguir
hasta el final. **E** abre la pausa; elige continuar o volver con flechas y
Enter. En Xbox usa cruceta o joystick, A, START y B; en teléfono, los cuatro
botones de flechas. El ajuste del ritmo permite compensar el audio Bluetooth.

Las flechas siguen los pulsos analizados del MP3 y su reloj de reproducción.
La música del patio espera durante el ensayo y se reanuda al salir. Los puntos
y guardados de la escuela se conservan. Consulta `ENSAYO_TEATRO.md` para los
controles, sincronización, archivos nuevos y prompts del arte.

## Pac-Man educativo

Acércate a la maquinita a la derecha del pizarrón y pulsa **Enter o A**. Se abre
un Pac-Man con pixel art, laberinto, cuatro fantasmas, bolitas de poder,
tres vidas, récord y niveles.

1. Come una bolita grande para activar el poder.
2. Lee la suma. Las cuatro respuestas aparecen sobre los fantasmas.
3. Cómete al fantasma con la respuesta correcta: ganas **500 puntos** y pasas de nivel.

La versión original genera sumas con operandos de 0 a 9. Se conserva ese modo y
se añade la opción de sumas de 0 a 49. El poder dura 22 segundos para dar tiempo
a resolver y alcanzar al fantasma. Una respuesta incorrecta mantiene el nivel;
el fantasma vuelve a su casa y puedes seguir buscando.

Teclado: **flechas** para moverte o elegir, **Enter** para iniciar y **E** para pausar.
En pausa, elige **Continuar** o **Salón** con las flechas y confirma con Enter.
En el selector de sumas, cambia la dificultad con **← →**. También siguen
disponibles WASD, P para pausa y espacio o Esc para volver al salón. Mando Xbox: **joystick/cruceta**, **A** para iniciar
o continuar, **START** para pausa y **B** para volver. En teléfono, usa la cruceta
y los botones del minijuego.

La música del salón se detiene mientras juegas. Pac-Man usa efectos retro
sintetizados y los aciertos usan el sonido START proporcionado. Al salir se
reanuda la música del salón y el alumno sigue en el mismo lugar. La puntuación
de Pac-Man tiene su propio récord; las estrellas de la aventura se conservan.

También se incluye `Pacman_Educativo_Web.html`: una edición independiente en un
solo archivo, con todos sus recursos incluidos. Descárgalo y ábrelo en el navegador.
Puede publicarse junto a `index.html` si quieres compartir el minijuego por separado.

## Maestros y grupos

| Grupo | Nombre de la lista |
| --- | --- |
| 1.º A | Blanca Griselda Martínez Sánchez |
| 1.º B | Diana Paola Ruiz Gómez |
| 2.º A | Norma Alicia Manzano Sepúlveda |
| 2.º B | Ema Alejandra Caudillo Guerrero |
| 3.º A | Ángel Arroyo Vargas |
| 3.º B | Laura Vanessa Rodríguez Castro |
| 4.º A | Emilia Mijares Rubio |
| 4.º B | Cesia Hernández Rosales |
| 5.º A | Luis Miguel García Robles |
| 5.º B | Angélica Martínez Rico |
| 6.º A | Dolores Niño Morín (Maestro Lolo) |
| 6.º B | José Emilio Arroyo Mijares |

Cristel Deyanira Montes Dimas figura como Criss, intendente; Mauricio Vidal
Salinas como administrativo en Dirección; María Alejandra Alvarado Sandoval
como velador en el directorio. Raúl, Claudia y José Guadalupe conservan sus personajes.

## Editar la escuela

Abre **Editar escuela** desde la portada o el mapa. Los números señalan edificios
fijos: cambia sus etiquetas para colocar el grupo que corresponda. Los profes
siguen la etiqueta de su grupo, y la entrada al salón jugable sigue al grupo del
maestro Ángel. En **Profes y grupos** puedes cambiar asignaciones y usar **Ver salón**.

Los cambios se guardan en el navegador. **Exportar guardado** descarga una copia
JSON para usarla con **Importar guardado** en otro navegador. **Aplicar lista de
maestros** recupera las asignaciones de esta lista conservando las etiquetas.
La actualización admite los guardados de la versión anterior.

Los salones parten de la distribución del JSON recibido. **Usar salones de esta
versión** restaura sus etiquetas y reubica a los profesores según sus grupos.

## Controles

- Flechas para moverte por la escuela, elegir respuestas y recorrer todos los menús.
- Enter para comenzar, hablar, entrar o salir, responder, continuar y lanzar el trompo.
- **E** abre/cierra la pausa y el mapa. Elige **Paso: correr**
  o **Paso: caminar**, sonido, uniformes o edición; confirma con Enter.
- En el editor y el selector del día: **↑ ↓** cambia de campo, **← →** cambia el
  grado o día y **Enter** activa botones o pasa al siguiente campo. Escribe nombres
  y grupos con el teclado; los cambios siguen guardándose automáticamente.
- En la imagen de uniformes y listas: las flechas desplazan la lectura; Enter
  pasa a la siguiente opción. Los apartados se abren con Enter.
- En Pac-Man: flechas para jugar y E para pausar; flechas y Enter para elegir
  entre continuar y volver al salón.
- **Espacio es B**: mantenlo para correr en el patio o púlsalo para volver desde un menú/minijuego.
- También funcionan WASD, Shift para correr, M para mapa y Escape para volver.
- Teléfono: cruceta y A.
- Xbox One Bluetooth, Xbox 360 y XInput: joystick/cruceta, A para actuar,
  B para correr/cerrar, X o START para mapa y Y para sonido.

## Archivos

Los archivos están preparados para alojamiento estático. El botón de descarga
del mapa obtiene el ZIP de `main` del repositorio actual, con el código y los
recursos que publiques. Si usas otro repositorio, actualiza esa dirección en `index.html`.

Documentación de GitHub:

- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

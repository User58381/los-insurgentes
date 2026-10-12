# Los Insurgentes · La aventura del saber

Juego HTML de la Escuela Primaria Los Insurgentes. Versión `20261012-teclado-completo-1`.

Contiene el mapa, alumnos, uniformes por día, personal, bienvenida del director,
retos, trompos con Oliver y las canciones proporcionadas.

## Actualizar el repositorio actual

1. Descomprime el paquete y abre la carpeta que contiene `index.html`.
2. En [User58381/los-insurgentes](https://github.com/User58381/los-insurgentes), abre **Add file → Upload files**.
3. Reemplaza juntos `index.html`, `style.css`, `engine.js`, `audio.js`, `game.js`,
   `bootstrap.js`, `school-settings.js`, `school-editor.js`, `keyboard.js`, `pacman-engine.js`
   y `pacman-ui.js` en la raíz.
4. Añade `assets/maquinita-pacman.png` dentro de la carpeta `assets`. Conserva las otras imágenes y canciones; el paquete completo también las incluye.
5. Guarda en `main`, espera la publicación y abre [el juego](https://user58381.github.io/los-insurgentes/).
6. Recarga con Ctrl + F5 o usa **Editar escuela → Borrar caché y actualizar**.

Sube los archivos descomprimidos. Las rutas deben quedar al mismo nivel que
`index.html`. Consulta `LEEME.txt` para las instrucciones de edición y guardados.

## Pac-Man educativo

Acércate a la maquinita a la derecha del pizarrón y pulsa **Enter, E o A**. Se abre
un Pac-Man con pixel art, laberinto, cuatro fantasmas, bolitas de poder,
tres vidas, récord y niveles.

1. Come una bolita grande para activar el poder.
2. Lee la suma. Las cuatro respuestas aparecen sobre los fantasmas.
3. Cómete al fantasma con la respuesta correcta: ganas **500 puntos** y pasas de nivel.

La versión original genera sumas con operandos de 0 a 9. Se conserva ese modo y
se añade la opción de sumas de 0 a 49. El poder dura 22 segundos para dar tiempo
a resolver y alcanzar al fantasma. Una respuesta incorrecta mantiene el nivel;
el fantasma vuelve a su casa y puedes seguir buscando.

Teclado: **flechas** para moverte o elegir y **Enter** para iniciar o pausar.
En pausa, elige **Continuar** o **Salón** con las flechas y confirma con Enter.
En el selector de sumas, cambia la dificultad con **← →**. También siguen
disponibles WASD, P para pausa y Esc para volver al salón. Mando Xbox: **joystick/cruceta**, **A** para iniciar
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

El mapa mantiene sus posiciones iniciales para que puedas ajustarlas: la lista
de personal no determina dónde está físicamente cada salón.

## Controles

- Flechas para moverte por la escuela, elegir respuestas y recorrer todos los menús.
- Enter para comenzar, hablar, entrar o salir, responder, continuar y lanzar el trompo.
- Mantén Enter unos **0.65 segundos** para abrir el menú y mapa. Elige **Paso: correr**
  o **Paso: caminar**, sonido, uniformes o edición; confirma con Enter.
- En el editor y el selector del día: **↑ ↓** cambia de campo, **← →** cambia el
  grado o día y **Enter** activa botones o pasa al siguiente campo. Escribe nombres
  y grupos con el teclado; los cambios siguen guardándose automáticamente.
- En la imagen de uniformes y listas: las flechas desplazan la lectura; Enter
  pasa a la siguiente opción. Los apartados se abren con Enter.
- En Pac-Man: flechas para jugar y Enter para pausar; flechas y Enter para elegir
  entre continuar y volver al salón.
- También funcionan WASD, E/Espacio para actuar, Shift para correr y M para mapa.
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

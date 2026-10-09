# Los Insurgentes · La aventura del saber

Juego web de la Escuela Primaria Los Insurgentes. Esta carpeta contiene la versión publicada más reciente: mapa de la escuela, alumnos y personal, uniformes diarios, música, salón 3.º A, retos y trompos con Oliver.

## Subir a GitHub y activar GitHub Pages

Se recomienda hacerlo en una computadora para arrastrar las carpetas completas.

1. Descomprime el archivo y abre la carpeta que contiene `index.html`.
2. Inicia sesión en https://github.com y entra a https://github.com/new.
3. Escribe `los-insurgentes` como nombre del repositorio. Elige **Public** para usar GitHub Pages con una cuenta gratuita. Puedes marcar **Add a README file**. Pulsa **Create repository**.
4. En el repositorio, abre **Add file → Upload files**. Arrastra todo el contenido de la carpeta: `index.html`, `style.css`, `engine.js`, `audio.js`, `game.js`, `README.md`, `.nojekyll`, `assets` y `downloads`. Sube las carpetas con su contenido y conserva sus nombres. Sube el contenido, no la carpeta exterior ni el ZIP.
5. Guarda con **Commit changes**, directamente en la rama `main`. Si aparece **Propose changes**, confirma el cambio y, si se crea una solicitud, intégrala en `main`.
6. Abre **Settings → Pages**. En **Source**, elige **Deploy from a branch**. Selecciona **main** y **/(root)**. Pulsa **Save**.
7. Cuando termine la publicación, Pages mostrará la dirección del juego. Será similar a `https://TU_USUARIO.github.io/los-insurgentes/`.

El repositorio y el juego publicado con estas opciones serán públicos, incluidos los nombres que contiene el juego.

## Comprobar que quedó bien

Abre la dirección de GitHub Pages y pulsa START. Comprueba la bienvenida del director, las imágenes, el sonido, el acceso al salón y el reto de Oliver. La música empieza después de una interacción del jugador.

No abras la página con el botón de vista del archivo en GitHub: usa la dirección de GitHub Pages.

Si aparece un error 404, verifica que `index.html` esté en la raíz del repositorio, que Pages use `main` y `/(root)`, y que la publicación haya terminado. Para actualizar el juego, vuelve a subir los archivos modificados a la misma rama.

## Controles

- Computadora: flechas o WASD para caminar; E o Espacio para actuar; Shift para correr; M para mapa.
- Teléfono: cruceta y botón A.
- Xbox 360: joystick o cruceta para caminar; A para actuar; B para correr o cerrar; X o START para mapa; Y para sonido. Durante la bienvenida, X abre la guía de uniformes.

## Archivos

No se necesita instalar Godot, Node ni compilar. Los archivos están listos para un alojamiento estático. Las imágenes y canciones usan rutas relativas, compatibles con GitHub Pages.

El enlace del mapa permite descargar otra copia para jugar sin internet. Conserva `downloads/Aventura_Insurgentes_3A.zip` para mantener ese enlace.

## Documentación oficial

- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

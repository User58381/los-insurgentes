# Adaptación web del Pac-Man educativo

Se analizaron las clases Java suministradas y los archivos del proyecto Java,
en particular `Operacion`, `ArcadeCommon_GameModel`, `ArcadePacMan_HUD` y
`ArcadePacMan_GameRenderer`.

Las reglas educativas conservadas son: sumas aleatorias de 0 a 9; cuatro
respuestas distintas asociadas a los cuatro fantasmas; activación con bolita
energizadora; resultado correcto que da 500 puntos y cambia de nivel; tres vidas.

La implementación web usa JavaScript y Canvas, con un laberinto propio de 21 × 23
casillas y sprites dibujados en una cuadrícula de píxeles. No ejecuta las clases
Java ni depende de JavaFX. Los efectos clásicos se sintetizan; el sonido de
respuesta correcta es el START suministrado para el juego de la escuela.

Para facilitar el uso con primaria, el poder dura 22 segundos, las respuestas
llevan etiquetas grandes y las bolitas grandes se reponen si se agotaron.
Se añade una modalidad opcional con operandos de 0 a 49, pausa y controles táctiles.

El código Java de referencia identifica a Armin Reichert como autor del proyecto
Pac-Man FX (Copyright 2021–2025, MIT). Las modificaciones educativas fueron
proporcionadas por el maestro Ángel. Este minijuego recrea esa idea educativa
con código y gráficos propios para la web.

El récord del minijuego se guarda aparte de la configuración de salones y profes.
Salir del minijuego conserva la posición y el progreso de la aventura principal.

Validación: conectividad del laberinto, movimiento y colisiones, opciones sin
repetir, fantasmas correctos/incorrectos, vidas, niveles, pausa, reposición de
energía, entrada desde el salón, sonido positivo y retorno al salón. Los recorridos
automáticos también alcanzan la respuesta correcta usando los caminos del mapa.

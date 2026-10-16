# Animación de pasos del personal

Los 18 personajes del personal tienen pasos al seleccionarlos para jugar.
Se usan los sprites existentes. Los 17 personajes con imagen propia llevan
ajustes individuales para cada dirección. María Alejandra conserva su figura
genérica y usa la animación de sus uniformes.

`characters.js` contiene el dibujo compartido de personajes. Las piernas se
mueven en fases opuestas, manteniendo fijo el punto donde se unen al cuerpo.
Los recortes se ajustan por personaje para proteger el cabello, las manos,
los vestidos y los abrigos. El torso se dibuja en la cuadrícula original del
sprite para evitar que sus detalles cambien entre reposo y movimiento.

Cada dirección del personal se normaliza a la misma altura. Esto corrige los
sprites que se encogían al dar la espalda. El punto de apoyo de los pies sigue
anclado al suelo. Los personajes que están quietos conservan su postura.

El reloj de los pasos avanza según el desplazamiento real: caminar, correr y
el movimiento con joystick usan el mismo ciclo. Al chocar con un límite o
soltar los controles, los pies dejan de caminar. Las velocidades y controles
del juego se conservan.

El patio y el salón, la portería del fútbol y el recorrido de limpieza usan
este dibujo compartido. En fútbol solo mueve los pies el portero mientras
se desplaza; en limpieza se anima al jugador mientras recoge y lleva residuos.
La cuerda mantiene su salto y el teatro mantiene sus animaciones musicales.
La pausa y la preferencia del dispositivo para reducir movimiento se respetan.

No cambia el formato de las partidas ni las claves del navegador. Las imágenes,
canciones y efectos originales se reutilizan sin modificar sus archivos.

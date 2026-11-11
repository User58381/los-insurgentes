# Los Insurgentes · La aventura del saber — v16

Juego completo actualizado desde v15 el 10 de noviembre de 2026.

## Novedades de v16

- **Pintura:** 3 minutos y 30 segundos para completar las 12 zonas.
- **Guía del director:** imagen actualizada con uniforme de invierno y explicación accesible junto al cartel.

## También incluido

- **Escondidas con Romina:** habla con ella junto al teatro. Cuenta inicial de
  cinco segundos, cinco compañeros entre ocho escondites posibles, dos minutos,
  pistas, pausa y reintento. Si juegas como Romina se esconden otros compañeros.
  El logro suma 80 puntos la primera vez; las repeticiones mejoran el récord.
- **Clima de Nuevo Laredo:** temperatura en °C con un decimal, consulta al abrir
  y cada 15 minutos, lluvia/nubes/niebla/nieve en exteriores, indicador de último
  dato si no hay conexión. Las demostraciones son temporales y están rotuladas.
- **Invierno:** umbral inicial de 18 °C (incluido), configurable. Chamarra y
  pantalón rojos para niñas; azul marino para niños; polo roja y tenis blancos.
  Aplicado a alumnos, jugador, selector, trompo, teatro y retos. El personal
  conserva su ropa. Las tarjetas didácticas muestran el uniforme del día que
  preguntan, aunque el clima actual sea frío.
- **Horario actualizado:** lunes gala; martes/jueves blanco y cuadros;
  miércoles/viernes polo roja y mezclilla. Educación Física tiene su propio
  día configurable según el grupo. La guía visual suministrada está incluida.
- **Personajes:** 44 disponibles, búsqueda por nombre, filtros, vista previa,
  selección táctil con botón claro y confirmación directa con Enter/A.
- **Controles:** presets habitual/J-K-P, teclas configurables para acción,
  correr/volver y pausa, correr siempre y tres tamaños táctiles. Se mantienen
  flechas/WASD, teclado, móvil y mandos Xbox ya soportados.

## Instalación y actualización

Sigue `ACTUALIZAR.txt`. El ZIP completo contiene todos los recursos.
Sube el contenido descomprimido de `Los_Insurgentes_GitHub` a la raíz de tu
repositorio normal, junto a index.html. Incluye version.json y los nuevos JS/CSS.
No es necesario borrar los datos del navegador.

Se conservan editor, etiquetas personalizadas, 27 alumnos, 17 personajes del
personal, intro, todos los minijuegos, música, estrellas, puntos y guardados.
Las copias completas ahora incluyen también configuración de controles y clima.
Las partidas interrumpidas de escondidas regresan al patio al recargar; el logro
conseguido sí permanece. La temperatura de demostración no se guarda.

## Controles de escondidas

| Acción | Teclado | Mando | Pantalla |
| --- | --- | --- | --- |
| Caminar | Flechas / WASD | Palanca / cruceta | Cruceta |
| Buscar cerca | Enter | A | Buscar aquí / A |
| Correr | Espacio / Shift | B | Ajuste Correr siempre |
| Pista | H | X | Pista |
| Pausa | E / Escape | START | Pausa |
| Salir | Pausa → Volver al patio | Pausa → B | Volver al patio |

## Clima

Datos: [Open-Meteo](https://open-meteo.com/) y
[documentación](https://open-meteo.com/en/docs). Coordenadas de referencia de la
ciudad: 27.4763, -99.5164; zona horaria America/Matamoros. No solicita ubicación
al jugador ni envía nombres de alumnos. El servicio necesita internet.

Un dato guardado se identifica cuando falla la consulta o tiene más de 45 minutos.
El uniforme sigue ese último dato hasta recibir uno nuevo, o puedes fijarlo en
Clima. Si no hay datos, se usa el uniforme del día. La ropa se conserva dentro
del salón, pero allí no llueve. No se atribuye a la escuela el umbral de 18 °C:
es un valor inicial ajustable del juego.

## Música y efectos

Escondidas reutiliza exactamente `assets/audio/limpieza-criss.mp3` y los efectos
`contador-criss.wav` y `start-106.wav`, ya usados por el dibujo con el maestro Ángel.
Respeta silencio global, pausas y regreso a la música del patio.

## Verificación

`node --test tests/*.cjs` ejecuta pruebas de lógica, integración, guardados,
controles, clima, audio y escondidas. `python3 preparar_version.py` regenera los
hashes de recursos y el identificador v16 después de cualquier edición.
Consulta `VERIFICACION_V16.txt` para el alcance de la revisión de esta entrega.

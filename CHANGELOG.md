# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue una línea simple inspirada en Keep a Changelog.

## [Unreleased]

Sin cambios pendientes.

## [1.2.0] - 2026-04-25

### Añadido

- Scripts de validación local del catálogo y validación opcional de previews remotos.
- Módulos JS separados para catálogo, QR y cartas imprimibles.
- Integridad SRI para la carga externa de `QRCode.js`.
- Reglas configurables de puntuación para año, título y álbum.
- Marcador de equipos persistente.
- Renombrado y eliminación del equipo activo.
- Filtros de dificultad por hits, cortes de álbum, instrumentales/soundtrack y modo difícil.
- Modo playlist manual por álbum, número de cartas o lista de cartas.
- Buscador de carta impresa por número, sin mostrar spoilers antes de revelar.
- Campo `difficulty` explícito en cada canción del catálogo.
- Modo presentador para bloquear el revelado accidental al tocar la carta.
- Importación y exportación de sesión en JSON.
- Diagnóstico de previews remotos desde la interfaz.
- Soporte PWA básico con `manifest.webmanifest` y caché local mediante service worker.
- Módulos separados para sesión, playlist aleatoria y diagnóstico de previews.
- Generación progresiva de cartas imprimibles con indicador visual de progreso.
- Estado final `Colección lista` al terminar de calcular QR y maquetar la colección.
- Foco accesible visible para navegación por teclado.
- Soporte `prefers-reduced-motion` para reducir animaciones si el sistema lo solicita.

### Cambiado

- Sincronizada la versión de `package.json` con `v1.2.0`.
- Renombradas las imágenes JPEG de `.png` a `.jpg`.
- Movidos estilos inline de `index.html` a `styles.css`.
- Eliminada la carga duplicada de Google Fonts.
- Las cartas imprimibles ahora incluyen número visible para fallback físico.
- Las opciones de playlist, dificultad, reglas, carta impresa y sesión quedan dentro de `Opciones avanzadas`, cerrado por defecto.
- Actualizada la versión de caché PWA para servir la interfaz más reciente.
- El tamaño de partida ahora selecciona cartas aleatorias con semilla persistente.
- Las cartas manuales tienen prioridad sobre filtros de dificultad, álbum y tamaño.
- Optimización de imágenes JPG para reducir el peso inicial.
- El diagnóstico de previews ahora usa concurrencia limitada y se puede cancelar.
- La colección imprimible diferencia la vista en pantalla de la salida real en papel.
- La impresión real pagina correctamente la colección completa sin barras de scroll ni recortes.
- El botón de imprimir queda desactivado mientras se están generando las cartas.
- Diagnóstico, opciones avanzadas y gestión de equipos quedan limitados a la pantalla inicial.
- Durante la partida se mantiene una consola más limpia con audio, revelar, historial y marcador.
- Rediseñado el menú superior como barra flotante con estado activo más visible.
- Mejorado el estado inicial con panel translúcido, borde dorado y mejor jerarquía visual.
- Mejorado el marcador con equipo activo más claro, hover y colores específicos para `+1` y `-1`.

### Corregido

- Evitada la inserción de HTML al renderizar nombres de equipos.
- Saneada la importación de sesiones JSON antes de restaurar estado.
- El service worker ya no cachea respuestas no válidas ni peticiones que no sean `GET`.
- Evitado que la sección de diagnóstico siga visible después de iniciar una partida.
- Evitado que la impresión de colección se genere como una única página recortada.
- Evitado que el usuario pueda lanzar la impresión antes de que todos los QR estén listos.

## [1.1.0] - 2026-04-08

### Añadido

- Final de partida real al agotar todas las canciones del catálogo activo.
- Tarjeta especial de cierre de partida integrada con la estética del juego.
- Persistencia del estado de partida completada tras recargar la página.
- Fallback visible para QR en la carta principal y en la colección imprimible cuando `QRCode.js` no está disponible.
- Mensajes de estado más claros para errores, lentitud o interrupciones en la carga de previews de audio.
- Descarte automático en la sesión de cartas con preview roto o inaccesible.
- Contenido genérico sin spoilers en las cartas de la colección imprimible.

### Cambiado

- La lógica de sesión ahora trata cada canción como una carta única estable, evitando repeticiones dentro del catálogo activo.
- El historial de sesión evita duplicados de la misma canción.
- Al volver a empezar una partida completada, la sesión se reinicia de forma limpia desde la pantalla principal.
- Los botones de control de audio quedaron alineados de forma consistente, especialmente en móvil.
- El panel de historial reserva altura desde el inicio para evitar saltos visuales de la carta principal.
- La colección imprimible aprovecha mejor el ancho disponible en escritorio y mantiene una estética más integrada con el juego.
- La maquetación de impresión centra mejor la rejilla de tarjetas en la hoja.

### Corregido

- Repetición de canciones cuando se agotaba el catálogo activo.
- Continuación de la partida después de llegar al final del catálogo.
- Restauración incoherente del estado al recargar tras completar un catálogo.
- Estados muertos o poco claros cuando un preview remoto falla o tarda demasiado.
- Bloqueo de la sesión por cartas con preview no reproducible.
- Degradación silenciosa cuando falla la generación de códigos QR.
- Persistencia visual de la carta de fin en la cara frontal al reiniciar una nueva partida sin cerrar el navegador.

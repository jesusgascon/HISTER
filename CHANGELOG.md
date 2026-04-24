# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue una línea simple inspirada en Keep a Changelog.

## [Unreleased]

### Añadido

- Scripts de validación local del catálogo y validación opcional de previews remotos.
- Módulos JS separados para catálogo, QR y cartas imprimibles.
- Integridad SRI para la carga externa de `QRCode.js`.
- Reglas configurables de puntuación para año, título y álbum.
- Marcador de equipos persistente.
- Filtros de dificultad por hits, cortes de álbum, instrumentales/soundtrack y modo difícil.
- Modo playlist manual por álbum, número de cartas o lista de cartas.
- Buscador de carta impresa por número, sin mostrar spoilers antes de revelar.
- Campo `difficulty` explícito en cada canción del catálogo.
- Modo presentador para bloquear el revelado accidental al tocar la carta.
- Importación y exportación de sesión en JSON.
- Diagnóstico de previews remotos desde la interfaz.
- Soporte PWA básico con `manifest.webmanifest` y caché local mediante service worker.

### Cambiado

- Sincronizada la versión de `package.json` con `v1.1.0`.
- Renombradas las imágenes JPEG de `.png` a `.jpg`.
- Movidos estilos inline de `index.html` a `styles.css`.
- Eliminada la carga duplicada de Google Fonts.
- Las cartas imprimibles ahora incluyen número visible para fallback físico.
- Las opciones de playlist, dificultad, reglas, carta impresa y sesión quedan dentro de `Opciones avanzadas`, cerrado por defecto.
- Actualizada la versión de caché PWA para servir la interfaz más reciente.

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

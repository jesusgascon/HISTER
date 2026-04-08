# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue una línea simple inspirada en Keep a Changelog.

## [1.1.0] - 2026-04-08

### Añadido

- Final de partida real al agotar todas las canciones del catálogo activo.
- Tarjeta especial de cierre de partida integrada con la estética del juego.
- Persistencia del estado de partida completada tras recargar la página.
- Fallback visible para QR en la carta principal y en la colección imprimible cuando `QRCode.js` no está disponible.
- Mensajes de estado más claros para errores, lentitud o interrupciones en la carga de previews de audio.

### Cambiado

- La lógica de sesión ahora trata cada canción como una carta única estable, evitando repeticiones dentro del catálogo activo.
- El historial de sesión evita duplicados de la misma canción.
- Los botones de control de audio quedaron alineados de forma consistente, especialmente en móvil.
- El panel de historial reserva altura desde el inicio para evitar saltos visuales de la carta principal.

### Corregido

- Repetición de canciones cuando se agotaba el catálogo activo.
- Continuación de la partida después de llegar al final del catálogo.
- Restauración incoherente del estado al recargar tras completar un catálogo.
- Estados muertos o poco claros cuando un preview remoto falla o tarda demasiado.
- Degradación silenciosa cuando falla la generación de códigos QR.

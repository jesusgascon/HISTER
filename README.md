# Hister: Queen Edition

Juego web estático inspirado en Hitster para jugar con canciones de Queen. La aplicación selecciona canciones aleatorias, reproduce previews de audio, muestra una carta con QR y permite revelar año, título y álbum.

## Características

- Catálogo de canciones organizado por año y álbum.
- Reproducción de previews remotos de Apple/iTunes.
- Carta interactiva con QR y reverso con la respuesta.
- Filtros por época.
- Historial de sesión sin spoiler: se actualiza al revelar o al pasar a la siguiente canción.
- Sin repeticiones dentro del catálogo activo durante la sesión.
- Final de partida real al agotar el catálogo, con tarjeta especial de cierre.
- Persistencia del estado de sesión y del final de partida tras recargar.
- Manejo más robusto de errores de audio y tiempos de espera de previews remotos.
- Cartas imprimibles con QR o fallback visible si el generador QR no está disponible.
- Fondo de concierto aleatorio entre dos imágenes locales.
- Diseño responsive para escritorio y móvil, con panel de historial estable.

## Estructura

- `index.html`: estructura de la aplicación.
- `styles.css`: estilos visuales, impresión y responsive.
- `app.js`: lógica del juego, audio, navegación, historial y fondo aleatorio.
- `data.js`: catálogo de canciones y URLs de preview.
- `CHANGELOG.md`: registro de cambios por versión.
- `queen_logo.png`: imagen decorativa del proyecto.
- `queen_concert_bg.png`: fondo principal.
- `queen_concert_bg_alt.png`: fondo alternativo original/procedural.

## Uso local

No requiere compilación ni instalación de dependencias. Al ser una web estática, puedes abrir `index.html` directamente o servir la carpeta con un servidor local:

```bash
python3 -m http.server 8000
```

Después abre `http://localhost:8000`.

## Estado de la sesión

La aplicación guarda automáticamente en `localStorage`:

- Canciones ya usadas dentro del catálogo activo.
- Historial de canciones reveladas.
- Filtro por época seleccionado.
- Estado de partida completada si ya no quedan canciones disponibles en el filtro actual.

Para empezar desde cero, usa `Reiniciar Sesión`.

## Robustez ante fallos externos

La app depende de dos recursos externos:

- Previews de audio remotos de Apple/iTunes.
- Librería `QRCode.js` cargada desde CDN.

Si falla un preview, la consola de juego muestra mensajes claros para reintentar o cambiar de canción. Si el generador QR no está disponible, el juego sigue funcionando y muestra un fallback visible con la URL del preview.

## Publicación en GitHub Pages

1. Crea un repositorio público en GitHub.
2. Sube estos archivos al repositorio.
3. En GitHub, ve a `Settings > Pages`.
4. Selecciona `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
5. Guarda los cambios y espera a que GitHub publique la página.

## Notas legales

Este proyecto es un tributo fan sin ánimo de lucro. Queen, sus canciones, nombres, marcas y cualquier material musical pertenecen a sus titulares correspondientes. Las URLs de audio apuntan a previews públicos de Apple/iTunes y no incluyen archivos de audio alojados en este repositorio.

El código propio del proyecto se publica bajo licencia MIT. La licencia no concede derechos sobre marcas, música, nombres de artistas ni material de terceros.

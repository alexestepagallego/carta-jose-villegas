# Carta digital · Pizza José Villegas

Implementación en **Astro** del handoff de diseño que está en la carpeta padre
(`../HANDOFF.md` + `../index.html`). Sitio estático de una sola página, pensado
para móvil (393 × 852) y para abrirse desde un QR en mesa.

## Arranque

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run preview    # sirve dist/
npm run check      # typecheck de .astro y .ts
```

## Estructura

```
src/
  data/carta.ts            Carta completa (textos literales del restaurante) + tokens de color
  lib/geometry.ts          Reparto e inclinación de las franjas; se usa en build y en cliente
  lib/menu.ts              Estado en cliente: categoría activa, cabecera, apertura de fichas
  components/Hero.astro    Portada
  components/CategoryBands.astro  Índice de franjas triangulares
  components/CategorySheet.astro  Ficha de una categoría
  layouts/Base.astro       <head>, fuentes, metadatos
  pages/index.astro        Composición de la página
  styles/global.css        Tokens y estilos
scripts/prepare-logo.mjs   Recorta el fondo del logo con alfa real
```

### Por qué está montado así

- **Todo el contenido se renderiza en el build.** Las 5 fichas van en el HTML, no
  las construye JavaScript. La carta se lee aunque el script falle, y no hay salto
  de contenido al cargar.
- **`lib/geometry.ts` se comparte entre build y cliente.** El estado inicial
  (categoría 0 activa) sale ya con su `clip-path` puesto desde el servidor, así que
  la primera pintura es la correcta; el cliente solo recalcula al cambiar de
  categoría. Un único sitio donde tocar la geometría.
- **El JS es una sola función** (`initMenu`) sobre `data-*`, sin framework: el
  comportamiento es scroll → índice activo → clases. Unos 2 kB.
- **Las imágenes pasan por `astro:assets`**: los PNG de 2–4 MB salen como WebP con
  `srcset` por densidad. Medido en Chromium a 393 × 852 con DPR 3 (el caso peor),
  recorriendo las cinco categorías: **~444 kB** en total — 31 kB de HTML, 360 kB de
  imágenes y 52 kB de fuentes. Los PNG originales suman 16 MB.
- **Las tipografías van autoalojadas** (`@fontsource`), sin llamada a Google Fonts.
- **Las franjas son `<button>`**, no `<div>` con `onClick`, con `aria-label`
  ("PIZZAS — ver los 28 platos"). El `clip-path` recorta también el hit-testing, así
  que cada cuña responde solo en su área. Las fichas son `role="dialog"` y se
  cierran también con `Escape`.

## Diferencias respecto al prototipo

Dos cosas que el prototipo tenía y aquí están resueltas:

1. **Recuadro blanco alrededor del logo.** El PNG no tiene alfa y el prototipo lo
   disimulaba con `mix-blend-mode: multiply`, pero el contenedor del logo crea un
   contexto de apilamiento (`position: relative; z-index: 2`) que aísla el blend:
   el recuadro se veía. `scripts/prepare-logo.mjs` recorta el fondo con alfa real
   (relleno por difusión desde los bordes, así que los blancos encerrados de la
   rotulación se conservan) y el `mix-blend-mode` ya no hace falta.
2. **Cursor del ratón incrustado en `assets/logo.png`.** El fichero entregado por el
   cliente lleva un puntero dibujado sobre el fondo, arriba a la izquierda de la
   porción. El mismo script lo elimina descartando las islas opacas residuales tras
   el recorte. **Conviene pedir al cliente el logo limpio y vectorial**; esto es un
   parche.

`npm run prepare:logo` regenera `src/assets/logo.png` desde `../assets/logo.png`.

## Pendiente

- **Foto de fondo de la portada**: el cliente no la ha entregado. Cuando llegue, va
  en `src/assets/local.jpg` y se descomenta el bloque marcado en
  `components/Hero.astro`.
- **Alérgenos**: se retiraron a propósito del prototipo porque deducirlos de los
  ingredientes producía afirmaciones falsas. Hace falta la tabla oficial por plato
  del restaurante antes de mostrarlos.
- **Erratas de la carta**: los textos se transcriben literalmente ("SALSA BBO",
  "QUESO CUARDO", "QUEDAR"). Confirmar con el cliente antes de corregir.
- **Flecha de la portada**: apunta hacia arriba, como en el prototipo (acompaña al
  gesto de deslizar hacia arriba). El handoff la describe como "punta en V", que
  sugiere hacia abajo. Confirmar cuál es la intención.
- **Iconos de la PWA** (`public/icon-*.png`): generados a partir del logo. Sustituir
  por unos diseñados si la carta se va a instalar en pantalla de inicio.
- Antes de publicar, poner el dominio en `site` dentro de `astro.config.mjs`.

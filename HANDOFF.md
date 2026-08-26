# Handoff: Carta digital Pizza José Villegas (móvil)

## Overview
Carta digital de un solo scroll para móvil. Dos pantallas: portada con el logo y una
llamada a deslizar, y un índice de categorías en franjas triangulares con scroll
magnético (una pantalla por categoría). Al tocar una franja se abre a pantalla completa
la lista de platos de esa categoría, con precios y notas de la carta.

Diseñada a 393 × 852 (iPhone 14/15). Todo el layout es vertical y táctil.

## About the Design Files
Los ficheros de este paquete son **referencias de diseño escritas en HTML**: prototipos
que muestran el aspecto y el comportamiento previstos, no código de producción para
copiar tal cual. El trabajo consiste en **recrear estos diseños en el entorno del
proyecto destino** (React, Vue, Svelte, Astro, nativo…) con sus patrones y librerías;
si todavía no hay entorno, elige el framework más adecuado e impleméntalo allí.

El paquete trae dos versiones del mismo diseño. **`index.html` es la de referencia**:
HTML + CSS + JS plano, sin dependencias, se abre en el navegador y se puede ejecutar y
modificar directamente. `Carta Jose Villegas.dc.html` es el original tal como se
construyó (plantilla con huecos `{{ }}` + clase de lógica, servida por `support.js`):
sirve de referencia, pero no es una dependencia a integrar. `image-slot.js` es solo el
placeholder de imagen arrastrable del prototipo — en producción se sustituye por una
`<img>` normal.

## Fidelity
**Alta fidelidad.** Colores, tipografía, tamaños, transiciones y copys son los
definitivos. La geometría de las franjas (clip-path) y las fotos superpuestas deben
reproducirse fielmente. Los textos de los platos son la carta real del restaurante:
**no reescribirlos**.

## Screens / Views

### 1. Portada (`section[data-screen-label="01 Portada"]`)
- **Propósito**: primer impacto de marca e invitación a deslizar.
- **Layout**: `height: 100dvh`, `display: grid`, `grid-template-rows: 1fr auto 1fr`,
  `justify-items: center`. Punto de anclaje de scroll (`scroll-snap-align: start`).
- **Componentes**:
  - Foto de fondo del local: `position: absolute; inset: 0`, `opacity: 0.14`,
    `filter: grayscale(0.3)`, `object-fit: cover`. **Pendiente**: el cliente aún no ha
    entregado esta foto (en el prototipo es un hueco `<image-slot id="jv-hero-bg">`).
  - Velo: `linear-gradient(180deg, rgba(251,250,248,.35) 0%, rgba(251,250,248,0) 45%, rgba(251,250,248,.75) 100%)`, `pointer-events: none`.
  - Kicker superior: "Calzone · Pizzas · Roscas" — monoespaciada 11px/1, weight 500,
    `letter-spacing: .34em`, mayúsculas, color `#8a827a`. Alineado abajo de su fila,
    `padding-bottom: 8px`.
  - Logo: `width: min(80vw, 330px)`, `aspect-ratio: 16/9`, `object-fit: contain`,
    `mix-blend-mode: multiply` (el PNG no tiene alfa: su blanco ~#fcfcfc se funde así
    con el papel). Fichero `assets/logo.png`.
  - Llamada: "Descubre nuestra carta" — Archivo 400, 22px/1.25, `max-width: 220px`,
    centrado, `text-wrap: balance`, color `#16130f`.
  - Flecha: SVG 26 × 74, línea vertical + punta en V, `stroke #16130f`, `stroke-width: 2`,
    extremos redondeados. Animación `nudge`: `translateY(6px)` opacidad .55 →
    `translateY(-6px)` opacidad 1 → vuelta; 2.4s `ease-in-out` infinita.
  - Separación llamada/flecha: `gap: 26px`; bloque con `padding-top: 54px`.

### 2. Categorías (franjas triangulares)
- **Propósito**: índice visual de las 5 categorías; la activa se amplía y se colorea.
- **Estructura**: contenedor `position: relative` con
  - un hijo `position: sticky; top: 0; height: 100dvh; overflow: hidden` que pinta todo, y
  - un bloque hermano con `margin-top: -100dvh` que contiene **una caja de 100dvh por
    categoría** con `scroll-snap-align: start` y `pointer-events: none`: son solo los
    puntos de anclaje del scroll magnético.
- **Cabecera** (dentro del sticky): 92px de alto, logo 104 × 56 centrado,
  `object-fit: contain`, `mix-blend-mode: multiply`. Aparece cuando
  `scrollTop > alturaViewport * 0.35`: `opacity 0→1` y `translateY(-12px→0)`,
  transición `opacity .45s linear, transform .45s cubic-bezier(.32,.72,0,1)`.
- **Zona de franjas**: `position: absolute; top: 92px; left/right: 0; bottom: 0`.

#### Geometría de las franjas
Con `n = 5` categorías y `activa = i`:
1. Reparto de altura: la activa ocupa `share = 0.40` del alto útil; las otras
   `(1 - share) / (n - 1) = 0.15` cada una. Acumulado `cum[0..n]`.
2. Mapeo a porcentaje del contenedor: `base[i] = 8 + cum[i] * 84`.
3. Inclinación de cada frontera (6 fronteras, `t = 9`):
   `tilts = [t, t*1.2, -t, t*0.85, -t*0.9, t*0.6]`;
   `L[i] = base[i] - tilts[i]/2` (borde izquierdo), `R[i] = base[i] + tilts[i]/2` (derecho).
4. Cada franja es un `div` a pantalla completa recortado:
   `clip-path: polygon(0% L[i]%, 100% R[i]%, 100% R[i+1]%, 0% L[i+1]%)`.
   Es lo que produce las cuñas del boceto: al cambiar la activa, el polígono se anima
   (`transition: clip-path .62s cubic-bezier(.32,.72,0,1)`).
- **Franja activa**: fondo `oklch(0.97 0.022 H)`, bordes superior e inferior
  `1px solid oklch(0.56 0.16 H)`, `z-index: 2`.
- **Franja inactiva**: fondo `#fbfaf8`, bordes `1px solid #c9c3bb`, `z-index: 1`.
- La franja entera es el área táctil (`cursor: pointer`, `onClick`); el `clip-path`
  recorta también el hit-testing, así que solo la cuña responde.

#### Nombre y CTA de cada franja
Anclados al borde superior de su franja (`topEdge = (L[i]+R[i])/2`), fuera del
recortado y con `pointer-events: none`:
- Nombre: `top: calc(topEdge% + 11px)`. Activa: Archivo Black 27px, `letter-spacing: .05em`,
  color `oklch(0.56 0.16 H)`. Inactiva: 15px, `letter-spacing: .12em`, color `#a8a29b`.
- CTA "Ver los N platos →": `top: calc(topEdge% + 47px)`, monoespaciada 10px, weight 500,
  `letter-spacing: .16em`, mayúsculas, mismo color que el nombre; `opacity: 1` solo en la
  activa (0 en las demás).
- Lado alterno según categoría: izquierda `left: 7%`, derecha `right: 5%`.

#### Fotos de las categorías
`div` con `background-image` (no `<img>`), `background-size: contain`, `no-repeat`, centrado:
- Activa: tamaño nominal de la categoría, `top: calc(topEdge% + 74px)`, `z-index: 5`, sin
  filtro. Al medir más que la franja, **desborda por abajo y se superpone a la siguiente
  categoría** — es intencionado (la "superposición" del boceto).
- Inactiva: 30% del tamaño nominal, `top: calc(topEdge% + 28px)`, `z-index: 3`,
  `filter: grayscale(1) opacity(.5)`.
- Transiciones: `top/width/height .62s cubic-bezier(.32,.72,0,1)`, `filter .5s linear`.

| Categoría | Hue (oklch) | Foto | Tamaño activa (px) | Lado |
|---|---|---|---|---|
| PIZZAS | 38 | `assets/pizza.png` | 196 × 218 | izquierda |
| BOCADILLOS XXL | 145 | `assets/bocadillo.png` | 268 × 150 | derecha |
| ROSCAS | 78 | `assets/rosca.png` | 194 × 194 | izquierda |
| PANINIS XXL | 300 | `assets/panini.png` | 248 × 200 | derecha |
| CALZONES | 195 | `assets/calzone.png` | 218 × 176 | izquierda |

### 3. Ficha de categoría (panel a pantalla completa)
- **Propósito**: leer los platos de una categoría.
- **Layout**: `position: fixed; inset: 0; z-index: 40`, fondo `#fbfaf8`,
  `overflow-y: auto`, `overscroll-behavior: contain`. Cerrada:
  `transform: translateY(100%)` + `visibility: hidden`. Abierta: `translateY(0)`.
  Transición `transform .5s cubic-bezier(.32,.72,0,1), visibility .5s linear`.
- **Cabecera** `position: sticky; top: 0`, fondo `#fbfaf8`, borde inferior
  `1px solid #e7e3dd`, `padding: 18px 20px 16px`, `gap: 14px`:
  - Botón atrás: 40 × 40, círculo, borde `1px solid #ddd8d1`, fondo `#fff`, glifo "←" 19px.
  - Título: Archivo Black 20px, `letter-spacing: .03em`, color `oklch(0.56 0.16 H)` de la categoría.
- **Cuerpo**: `padding: 4px 20px 64px`.
  - *Bloque intro* (solo Pizzas): caja con borde `1px solid #e7e3dd`, `border-radius: 10px`,
    `padding: 13px 15px`, filas etiqueta/precio unidas por línea de puntos
    (`border-bottom: 1px dotted #d8d2ca`). Etiqueta monoespaciada 10.5px mayúsculas
    `letter-spacing: .1em` color `#6f675e`; precio Archivo 600 13px.
  - *Cabecera de subgrupo*: monoespaciada 12px, mayúsculas, `letter-spacing: .18em`,
    color de la categoría, `padding: 22px 0 6px`.
  - *Fila de plato*: `display: grid; grid-template-columns: 1fr auto; gap: 14px;
    padding: 13px 0; border-bottom: 1px solid #f1ede7`.
    - Nombre: Archivo Black 14.5px/1.15, `letter-spacing: -.005em`, color `#16130f`.
    - Ingredientes: Archivo 400 12.5px/1.45, color `#6f675e`, `text-wrap: pretty`.
    - Precio: Archivo 600 15px, alineado a la derecha, `white-space: nowrap`.
    - Segundo precio ("Individual 6€"): monoespaciada 10px, weight 500, color `#8a827a`,
      debajo del precio, alineado a la derecha.
  - *Nota de subgrupo* (p. ej. "* Individuales 6€"): monoespaciada 10.5px, `#8a827a`,
    `padding: 11px 0 2px`.
  - *Nota de categoría*: caja `background: #f4f1eb`, `border-radius: 8px`,
    `padding: 12px 14px`, monoespaciada 11px/1.45, color `#6f675e`, `margin-top: 18px`.
  - *Pie fijo*: "Consulta al personal sobre alérgenos e intolerancias" —
    monoespaciada 10.5px, `#b0a79c`, centrado, `padding-top: 22px`.

## Interactions & Behavior
- **Scroll magnético**: el contenedor raíz es el scroller
  (`height: 100dvh; overflow-y: auto; scroll-snap-type: y mandatory`,
  `-webkit-overflow-scrolling: touch`, scrollbar oculta). Anclajes: la portada y una caja
  de 100dvh por categoría.
- **Categoría activa** (listener `scroll` pasivo):
  `i = clamp(round((scrollTop - alturaViewport) / alturaViewport), 0, n - 1)`.
  `scrolled = scrollTop > alturaViewport * 0.35` (controla la cabecera).
- **Abrir ficha**: tap en la franja → `open = i`. **Cerrar**: botón atrás → `open = null`.
  Se guarda el último índice abierto para que el panel mantenga su contenido durante la
  animación de salida.
- Sin estados hover (diseño táctil). Sin carga asíncrona: la carta es estática.

## State Management
- `active: number` — categoría bajo el scroll (0…4).
- `scrolled: boolean` — visibilidad de la cabecera.
- `open: number | null` — ficha abierta.
- `lastOpen: number` — último índice abierto (solo para la animación de cierre).
- Datos: array de categorías; cada una con `name`, `hue`, `src`, `w`, `h`, `side`,
  `intro?`, `footnote?` y `groups[]` de `{ title?, alt?, note?, items: [nombre, ingredientes, precio] }`.

## Design Tokens
- Papel: `#fbfaf8` · Tinta: `#16130f` · Texto secundario: `#6f675e`
- Gris inactivo: `#a8a29b` · Bordes inactivos: `#c9c3bb` · Bordes suaves: `#e7e3dd`,
  `#ddd8d1`, `#f1ede7` · Texto tenue: `#8a827a`, `#b0a79c` · Nota: fondo `#f4f1eb`
- Acentos por categoría: `oklch(0.56 0.16 H)` con H = 38 / 145 / 78 / 300 / 195;
  fondo de franja activa `oklch(0.97 0.022 H)`
- Tipografía: **Archivo Black** (nombres y títulos), **Archivo** 400/500/600 (texto),
  monoespaciada del sistema (`ui-monospace, SFMono-Regular, Menlo, monospace`) para
  etiquetas, precios secundarios y notas. Google Fonts:
  `Archivo+Black` + `Archivo:wght@400;500;600;700`
- Radios: 3px (etiquetas) · 8px · 10px · 999px (botón)
- Easing: `cubic-bezier(.32,.72,0,1)`; duraciones .4s / .45s / .5s / .62s
- Sin sombras en todo el diseño.

## Assets
En `assets/`, todos entregados por el cliente (generados con IA salvo el logo):
- `logo.png` — logo del restaurante. **Sin canal alfa**: fondo casi blanco; se integra con
  `mix-blend-mode: multiply`. Convendría recortarlo con alfa real.
- `pizza.png`, `bocadillo.png`, `rosca.png`, `panini.png`, `calzone.png` — recortes PNG con
  transparencia, uno por categoría. Pesan 2–4 MB cada uno: **optimizar** (WebP/AVIF,
  ~800px de ancho, varias densidades) antes de producción.
- Foto de fondo de la portada: **pendiente de entrega**.

## Files
- **`index.html` — implementación de referencia en HTML + CSS + JS plano, sin dependencias.**
  Se abre en el navegador tal cual (o `npx serve .`) y contiene toda la geometría, los
  estilos y los datos de la carta. Es el punto de partida recomendado: empieza por aquí,
  usa el README para entender el por qué de cada valor.
- `Carta Jose Villegas.dc.html` — el diseño original tal como se construyó (plantilla con
  huecos `{{ }}` + clase de lógica). Referencia; necesita `support.js` para renderizarse.
- `support.js` — runtime del fichero anterior. No va a producción.
- `image-slot.js` — placeholder de imagen arrastrable del prototipo. No va a producción.
- `assets/` — imágenes.

## Pendiente / decisiones abiertas
- **Alérgenos y etiquetas** (vegetariano, picante): se retiraron a propósito. En el
  prototipo se deducían de los ingredientes y eso producía afirmaciones falsas en una
  carta real. Hay que pedir al restaurante la tabla oficial por plato antes de mostrarlos.
- Los textos de la carta se transcriben literalmente de lo que envió el cliente,
  erratas incluidas (p. ej. "SALSA BBO", "QUESO CUARDO", "QUEDAR"). Confirmar con él
  antes de corregir.
- Sin idiomas adicionales, sin pedidos ni carrito: es solo carta de consulta.

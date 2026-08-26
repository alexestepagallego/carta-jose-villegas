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

## El bucle de fondo de la portada

Detrás del logo va un vídeo corto en bucle a baja opacidad: un pizzero metiendo
una pizza en un horno de leña. El original del cliente está en
`../assets/portada.mp4`; los ficheros que sirve la web salen de `npm run portada`
(`scripts/encode-hero-video.mjs`), que hace cuatro cosas:

1. **Quita el audio.** El autoplay exige silencio y la pista solo pesa.
2. **Cierra el bucle con un fundido cruzado.** El vídeo generado empieza con la
   pizza en la pala y acaba con ella dentro del horno, así que el corte saltaba a
   la vista: 27,1 de diferencia media por píxel, frente a los 16,1 que cambia la
   escena por sí sola entre dos instantes cualesquiera. Solapando el último
   segundo sobre el primero baja a 4,8, por debajo del ruido de la propia escena.
3. **Codifica** H.264 `yuv420p` con `+faststart` —lo único que iOS reproduce de
   forma fiable sin esperar a la descarga completa— y un VP9 al lado. El VP9 va
   con CRF alto a propósito: al 22 % de opacidad los artefactos no llegan a
   pantalla, y a calidad alta pesaba *más* que el H.264, que al ir primero en las
   fuentes habría sido el peor de los dos mundos. Quedan en 944 kB y 636 kB.
4. **Saca el póster**, que es lo que se ve mientras carga y lo que queda fijo con
   movimiento reducido.

Para cambiar el vídeo: sustituye `assets/portada.mp4` y lanza `npm run portada`.
Si el nuevo se llama distinto, cambia también la constante `video` de
`components/Hero.astro`.

**Qué debe cumplir un vídeo nuevo:** vertical 9:16 (720 × 1280 va sobrado), con lo
importante centrado —los móviles actuales son más altos que 16:9 y `object-fit:
cover` recorta un 18–20 % de los lados—, 5–10 s y por debajo de ~1,5 MB. Y sobre
todo: **escena oscura con luces brillantes**. Al 22 % de opacidad sobre el fondo de
la carta, una llama llega a 1,65:1 y la masa iluminada a 1,86:1, pero un tono medio
se queda en 1,30:1 y una sombra en 1,05:1, o sea invisible. Una cocina bien
iluminada no se vería.

### El velo

La presencia del vídeo se ajusta con `--hero-video-opacity` (0,22), y el velo de
`.hero-veil` es lo que mantiene legible el contenido por encima.

Hubo que recalibrarlo: el degradado del diseño abría su ventana clara en el 45 %,
justo donde cae el kicker (37–40 %). Con una foto estática y tenue no importaba;
con fuego detrás, el kicker se caía a 2,8:1. Ahora la ventana clara va arriba
(0–28 %), donde están las llamas y el arco y no hay texto encima.

Con el velo solo no bastaba —subirlo del 0,48 al 0,78 apenas movía el kicker de
3,99:1 a 4,11:1, y a cambio se comía el vídeo—, así que el kicker sube un nivel de
gris, a `--ink-2`. En la portada está justificado: es el único sitio donde ese
estilo tiene imagen en movimiento detrás y no un fondo plano. Medido a lo largo de
todo el bucle, el peor fotograma deja el kicker en **5,17:1** —el mismo 5,19:1 que
tenía en el diseño original sobre fondo plano— y la llamada en 14,0:1.

El autoplay no vale para quien ha pedido reducir el movimiento: `lib/hero.ts`
detiene el vídeo y deja el póster, atendiendo también al cambio de preferencia en
caliente. Si el navegador rechaza el autoplay, el póster se queda y la portada
funciona igual.

## Paleta

La carta va en **oscuro**. La paleta conserva el tono cálido del papel original
—hue 80 en oklch, no un gris neutro— para que siga leyéndose como carta de
restaurante y no como panel de administración. Los tokens están en
`styles/global.css`; los acentos de categoría, en `data/carta.ts`.

Sobre fondo oscuro los acentos necesitan más luminosidad: `oklch(0.56 0.16 H)`
pasa a `oklch(0.72 0.15 H)`. Medido sobre la página renderizada, los cinco quedan
entre 7,1:1 y 8,4:1 contra el fondo y entre 6,2:1 y 7,1:1 contra el tinte de su
franja activa. En la ficha de platos: nombre y precio 16,3:1, ingredientes 7,6:1,
cabecera de subgrupo 7,2:1, notas 5,2:1.

Todos los niveles contrastan igual o mejor que en la versión clara, que dejaba los
nombres inactivos en 2,4:1 y el pie de alérgenos en 2,3:1; aquí suben a 4,1:1 y
3,4:1 sin dejar de ser secundarios.

Un detalle que no se traslada solo: en reposo la foto de categoría se atenúa con
`opacity`, que sobre fondo oscuro funde hacia el negro y la convertía en un
borrón. Se le sube el brillo antes de atenuarla (`IDLE_BRIGHTNESS` en
`lib/geometry.ts`) para que vuelva a leerse como el fantasma tenue del diseño.

El logo no necesita tratamiento: la elipse negra se funde con el fondo y lo
sostienen el aro dorado y la rotulación.

## El índice de categorías

Las franjas no se reparten una pantalla, sino un lienzo de **1,8 pantallas**
(`CANVAS_SCREENS`), que se desplaza en vertical para dejar centrada la activa. Con
el lienzo de una sola pantalla del prototipo cabían las cinco categorías de golpe
y nada invitaba a deslizar; ahora nunca se ven más de tres a la vez —medido en
375 × 667, 393 × 852 y 412 × 915— así que hay que deslizar para recorrer la carta.

El reparto de la activa baja de 0,40 a **0,28** para compensar: sobre 1,8 pantallas
sigue midiendo 1,56 × una inactiva, o sea que el salto se sigue notando, y el alto
sobrante se va a las inactivas, que son las que empujan la carta fuera de pantalla.

La foto de la categoría activa se ancla al borde **inferior** de su franja, no al
superior. Así conserva el desbordamiento sobre la categoría siguiente que pide el
diseño sea cual sea el alto de la franja. Mantiene su tamaño nominal: escalarla con
la franja la hacía invadir el nombre de la categoría siguiente, colisión que el
diseño evita alternando los lados.

**El índice va ligado a la posición del scroll, no a transiciones CSS.** La
posición se lee como un número continuo (2,4 = "entre la 2 y la 3") y las franjas
se redibujan por fotograma; encima, la posición dibujada persigue a la real con un
suavizado exponencial (`RESPONSE` en `lib/menu.ts`).

Hacen falta las dos cosas, y por motivos opuestos:

- Con transiciones CSS por tiempo, en móvil el índice iba por detrás del dedo: el
  snap táctil se resuelve casi de golpe y la animación de 0,62 s llegaba tarde, así
  que se veía como un salto. Ligarlo al scroll lo pega al dedo.
- Pero con `scroll-snap-type: mandatory`, la rueda y el trackpad saltan de anclaje
  a anclaje sin pasar por las posiciones intermedias. Sin el suavizado, el salto se
  vería igual de brusco en el escritorio.

Medido en Chromium y en WebKit, ambos escenarios dan más de 30 fotogramas
intermedios por cambio de categoría. Con `prefers-reduced-motion` no se suaviza.

**Tocar una franja tiene dos pasos.** Un toque sobre una franja en reposo solo la
trae al frente —se amplía, toma color y aparece su CTA—; la ficha se abre con un
segundo toque, ya sobre la franja activa. El primer toque lleva el scroll a su
anclaje, así que la categoría activa la sigue decidiendo la posición del scroll y
no hay dos fuentes de verdad.

El recorrido de ese primer toque se anima a mano (`TAP_TRAVEL_MS`) en vez de con
`behavior: "smooth"`: el scroll suave nativo se comporta distinto en cada
navegador y encima choca con `scroll-snap-type: mandatory`, que corrige las
posiciones intermedias. Se desactiva el snap mientras dura el recorrido y se
restaura al llegar; si el dedo o la rueda se mueven, el recorrido se aparta.
Medido, Chromium y WebKit dan ahora el mismo resultado: 42 fotogramas. La etiqueta accesible acompaña: `Ir a ROSCAS` en
reposo, `ROSCAS — ver los 6 platos` cuando ya está activa.

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

3. **Fotos de categoría recortadas por los lados.** Ninguno de los cinco PNG tiene
   la proporción de su encuadre nominal —el del bocadillo se desvía un 40 %— y
   `<Image>` con ancho *y* alto recorta para llenar (`fit: "cover"` por defecto).
   El prototipo usaba `background-size: contain`, que encaja sin recortar. Se
   arregla con `fit="inside"`: Astro genera la foto a su proporción real y la caja
   nominal la sigue poniendo el CSS con `object-fit: contain`.

## Despliegue

Cada push a `main` dispara `.github/workflows/deploy.yml`, que construye `web/` y
publica `dist/` en GitHub Pages:
**https://alexestepagallego.github.io/carta-jose-villegas/**

Pages sirve el sitio bajo `/carta-jose-villegas/`, no en la raíz del dominio, así
que `site` y `base` se leen de `SITE_URL` y `BASE_PATH`. Las define el workflow a
partir de `actions/configure-pages`; en local y en cualquier host con dominio
propio se quedan vacías y el sitio vive en `/`, sin tocar nada.

Dos detalles que se derivan de eso:

- Los ficheros de `public/` no llevan el `base` puesto automáticamente:
  `Base.astro` los prefija con `import.meta.env.BASE_URL`.
- `manifest.webmanifest` usa rutas relativas, que se resuelven contra su propia
  URL y funcionan con y sin `base`.

Para probar en local la build tal cual sale en Pages:

```bash
SITE_URL=https://alexestepagallego.github.io BASE_PATH=/carta-jose-villegas npm run build
```

## Pendiente

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

/**
 * Geometría de las franjas triangulares.
 *
 * Con n categorías y una activa, el alto útil se reparte y cada frontera se
 * inclina un poco; cada franja es el polígono entre dos fronteras consecutivas.
 * La misma función se usa en el build (estado inicial, sin parpadeo) y en el
 * cliente (al cambiar de categoría), así que ambos parten de los mismos números.
 *
 * Las franjas NO se reparten una pantalla, sino un lienzo de CANVAS_SCREENS
 * pantallas: así no caben todas a la vez y hay que deslizar para recorrerlas.
 * El lienzo se desplaza en vertical para dejar centrada la categoría activa.
 */

/**
 * Alto del lienzo de franjas, en pantallas.
 *
 * Con 1 cabían las cinco categorías de golpe y nada invitaba a deslizar. Con 1,8
 * nunca se ven más de tres a la vez —medido en 375×667, 393×852 y 412×915—, así
 * que hay que deslizar para recorrer la carta.
 */
export const CANVAS_SCREENS = 1.8;

/**
 * Fracción del alto útil que ocupa la franja activa.
 *
 * Baja del 0,4 del diseño original porque el lienzo ya no mide una pantalla. Con
 * 0,28 sobre 1,8 pantallas la activa sigue midiendo 1,56× una inactiva —el salto
 * se nota— y el resto del alto se reparte entre las inactivas, que son las que
 * empujan la carta fuera de la pantalla.
 */
export const ACTIVE_SHARE = 0.28;

/** Grados de inclinación base de las fronteras. */
export const TILT = 9;

/** Una inclinación por frontera: n categorías → n + 1 fronteras. */
export const TILTS = [TILT, TILT * 1.2, -TILT, TILT * 0.85, -TILT * 0.9, TILT * 0.6];

/** Margen superior e inferior, en % de UNA pantalla, fuera del reparto. */
const PAD = 8;

export interface BandGeometry {
  /** `clip-path` de la franja. */
  clipPath: string;
  /** Borde superior en % del lienzo: ancla del nombre, el CTA y la foto. */
  topEdge: number;
  /** Borde inferior en % del lienzo. */
  bottomEdge: number;
}

/**
 * @param screens alto del lienzo en pantallas. Los porcentajes son del lienzo,
 *   así que los márgenes y las inclinaciones se dividen entre `screens` para
 *   que se vean igual que en el diseño original independientemente de su alto.
 */
/**
 * Cuánto de "activa" tiene cada franja, entre 0 y 1, para una posición continua.
 *
 * En un entero vale 1 para esa franja y 0 para el resto; entre dos categorías se
 * reparte entre ambas. La suma siempre es 1, así que el reparto de altura sigue
 * cuadrando. Es lo que permite que las franjas se transformen ligadas al scroll
 * en vez de saltar de un estado al siguiente.
 */
export function activeWeights(active: number, n: number): number[] {
  const k = Math.floor(active);
  const f = active - k;
  return Array.from({ length: n }, (_, i) => (i === k ? 1 - f : i === k + 1 ? f : 0));
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** @param active posición continua: 2.4 es "entre la 2 y la 3, más cerca de la 2". */
export function layout(active: number, n: number, screens = CANVAS_SCREENS): BandGeometry[] {
  const rest = (1 - ACTIVE_SHARE) / (n - 1);
  const weights = activeWeights(active, n);

  const cum = [0];
  for (let i = 0; i < n; i++) cum.push(cum[i] + rest + (ACTIVE_SHARE - rest) * weights[i]);

  const pad = PAD / screens;
  const base = cum.map((c) => pad + c * (100 - pad * 2));
  const left = base.map((b, i) => b - (TILTS[i] ?? 0) / screens / 2);
  const right = base.map((b, i) => b + (TILTS[i] ?? 0) / screens / 2);

  return Array.from({ length: n }, (_, i) => ({
    clipPath: `polygon(0% ${left[i]}%, 100% ${right[i]}%, 100% ${right[i + 1]}%, 0% ${left[i + 1]}%)`,
    topEdge: (left[i] + right[i]) / 2,
    bottomEdge: (left[i + 1] + right[i + 1]) / 2,
  }));
}

/**
 * Cuánto hay que subir el lienzo para dejar centrada la franja activa, medido
 * en alturas de la zona visible. Se aplica como
 * `translateY(calc(var(--stage-h) * shift))`.
 */
export function stackShift(
  geometry: BandGeometry[],
  active: number,
  screens = CANVAS_SCREENS,
): number {
  const center = (b: BandGeometry) => (b.topEdge + b.bottomEdge) / 2;
  const k = Math.floor(active);
  const next = geometry[k + 1];
  const centerPct = next ? lerp(center(geometry[k]), center(next), active - k) : center(geometry[k]);
  return 0.5 - (centerPct / 100) * screens;
}

/** Tamaño de la foto de una franja inactiva, respecto del nominal. */
export const IDLE_PHOTO_SCALE = 0.3;

/** Desplazamiento de la foto inactiva bajo el borde superior de su franja, en px. */
export const IDLE_PHOTO_OFFSET = 28;

/**
 * La foto activa desborda su franja por abajo esta fracción de su propio alto y
 * se superpone a la categoría siguiente. Es intencionado: viene del boceto.
 */
const PHOTO_OVERFLOW = 0.15;

export interface PhotoPlacement {
  width: string;
  height: string;
  top: string;
}

/**
 * Coloca la foto de una franja según lo activa que esté (0…1).
 *
 * En reposo cuelga de su borde superior y mide el 30 %; activa, mide el tamaño
 * nominal del diseño y se ancla al borde inferior, de modo que desborda sobre la
 * categoría siguiente. Entre medias todo se interpola, así que la foto acompaña
 * al dedo en vez de saltar entre dos estados.
 *
 * Mantiene el tamaño nominal en el extremo activo: escalarla con la franja la
 * hacía invadir el nombre de la categoría siguiente, colisión que el diseño evita
 * alternando los lados.
 */
export function photoPlacement(
  band: BandGeometry,
  nominal: { w: number; h: number },
  weight: number,
): PhotoPlacement {
  const scale = lerp(IDLE_PHOTO_SCALE, 1, weight);
  const height = nominal.h * scale;

  // En reposo: bajo el borde superior. Activa: el borde inferior de la foto cae
  // PHOTO_OVERFLOW por debajo del borde inferior de la franja.
  const anchorPct = lerp(band.topEdge, band.bottomEdge, weight);
  const anchorPx = lerp(IDLE_PHOTO_OFFSET, PHOTO_OVERFLOW * height - height, weight);

  return {
    width: `${(nominal.w * scale).toFixed(1)}px`,
    height: `${height.toFixed(1)}px`,
    top: `calc(${anchorPct.toFixed(3)}% + ${anchorPx.toFixed(1)}px)`,
  };
}

/**
 * Cuánto se aclara la foto en reposo antes de atenuarla.
 *
 * Sobre fondo oscuro, `opacity` funde hacia el negro: la foto en gris se hundía
 * en el fondo y quedaba como un borrón. Subiéndole el brillo antes de atenuarla
 * vuelve a leerse como el fantasma tenue que buscaba el diseño.
 */
const IDLE_BRIGHTNESS = 1.55;

/**
 * Opacidad del relleno fotográfico de la cuña.
 *
 * El techo lo marca el CTA, que es monoespaciada de 10 px sobre la propia cuña.
 * Sobre fondo casi negro una foto clara sube mucho aunque vaya muy transparente:
 * al 0,16 el CTA se caía a 3,8:1. Con 0,09 se queda en 4,8:1, que es lo que pide
 * un texto de ese tamaño, y la foto se sigue leyendo.
 */
export function fillOpacity(weight: number): number {
  return lerp(0.03, 0.09, weight);
}

/** Filtro de la foto: gris y tenue en reposo, limpia cuando está activa. */
export function photoFilter(weight: number): string {
  const grey = (1 - weight).toFixed(3);
  const brightness = lerp(IDLE_BRIGHTNESS, 1, weight).toFixed(3);
  const alpha = lerp(0.55, 1, weight).toFixed(3);
  return `grayscale(${grey}) brightness(${brightness}) opacity(${alpha})`;
}

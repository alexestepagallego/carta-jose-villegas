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
export function layout(active: number, n: number, screens = CANVAS_SCREENS): BandGeometry[] {
  const rest = (1 - ACTIVE_SHARE) / (n - 1);

  const cum = [0];
  for (let i = 0; i < n; i++) cum.push(cum[i] + (i === active ? ACTIVE_SHARE : rest));

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
  const band = geometry[active];
  const centerPct = (band.topEdge + band.bottomEdge) / 2;
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
  /** Ancla la foto al borde inferior de su franja, no al superior. */
  bottom: string;
}

/**
 * Coloca la foto de la franja activa.
 *
 * Conserva el tamaño nominal del diseño —crecer con la franja la hacía invadir
 * el nombre de la categoría siguiente, colisión que el diseño evita alternando
 * lados— y la ancla por abajo, de modo que el desbordamiento sobre la categoría
 * siguiente se mantiene sea cual sea el alto de la franja.
 */
export function activePhoto(band: BandGeometry, nominal: { w: number; h: number }): PhotoPlacement {
  return {
    width: `${nominal.w}px`,
    height: `${nominal.h}px`,
    // El borde inferior de la franja está a (100 − bottomEdge)% del fondo del lienzo.
    bottom: `calc(${(100 - band.bottomEdge).toFixed(3)}% - ${Math.round(nominal.h * PHOTO_OVERFLOW)}px)`,
  };
}

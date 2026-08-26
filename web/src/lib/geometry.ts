/**
 * Geometría de las franjas triangulares.
 *
 * Con n categorías y una activa, el alto útil se reparte y cada frontera se
 * inclina un poco; cada franja es el polígono entre dos fronteras consecutivas.
 * La misma función se usa en el build (estado inicial, sin parpadeo) y en el
 * cliente (al cambiar de categoría), así que ambos parten de los mismos números.
 */

/** Fracción del alto útil que ocupa la franja activa. */
export const ACTIVE_SHARE = 0.4;

/** Grados de inclinación base de las fronteras. */
export const TILT = 9;

/** Una inclinación por frontera: n categorías → n + 1 fronteras. */
export const TILTS = [TILT, TILT * 1.2, -TILT, TILT * 0.85, -TILT * 0.9, TILT * 0.6];

/** Margen superior e inferior, en % del contenedor, fuera del reparto. */
const PAD = 8;

export interface BandGeometry {
  /** `clip-path` de la franja. */
  clipPath: string;
  /** Borde superior en % del contenedor: ancla del nombre, el CTA y la foto. */
  topEdge: number;
}

export function layout(active: number, n: number): BandGeometry[] {
  const rest = (1 - ACTIVE_SHARE) / (n - 1);

  const cum = [0];
  for (let i = 0; i < n; i++) cum.push(cum[i] + (i === active ? ACTIVE_SHARE : rest));

  const base = cum.map((c) => PAD + c * (100 - PAD * 2));
  const left = base.map((b, i) => b - (TILTS[i] ?? 0) / 2);
  const right = base.map((b, i) => b + (TILTS[i] ?? 0) / 2);

  return Array.from({ length: n }, (_, i) => ({
    clipPath: `polygon(0% ${left[i]}%, 100% ${right[i]}%, 100% ${right[i + 1]}%, 0% ${left[i + 1]}%)`,
    topEdge: (left[i] + right[i]) / 2,
  }));
}

/** Tamaño de la foto de una franja inactiva, respecto del nominal. */
export const IDLE_PHOTO_SCALE = 0.3;

/** Desplazamiento de la foto bajo el borde de su franja, en px. */
export const PHOTO_OFFSET = { active: 74, idle: 28 } as const;

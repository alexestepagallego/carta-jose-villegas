/**
 * Genera el relleno fotográfico de las franjas de categoría.
 *
 * Las fotos de `assets/` son recortes con transparencia: puestas de fondo se
 * verían como una silueta flotando, no como una foto. Así que de cada una se
 * saca la mayor caja cuadrada centrada que sea casi toda opaca —la zona con
 * textura de comida, sin el fondo recortado alrededor— y esa es la que rellena
 * la franja: queso y pepperoni en pizzas, la miga del bocadillo, el azúcar de la
 * rosca, el bacon del panini, la masa del calzone.
 *
 * Se usan las fotos del propio cliente y no banco de imágenes por una razón
 * práctica: es la web pública de un restaurante, y lo que hay en abierto para
 * comida es casi todo CC BY-SA, que obliga a crédito visible y arrastra el
 * "compartir igual" sobre el diseño.
 *
 *   node scripts/make-band-fills.mjs
 */
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const CATEGORIAS = ['pizza', 'bocadillo', 'rosca', 'panini', 'calzone'];
const ENTRADA = 'src/assets';
const SALIDA = 'src/assets/fills';

/** Resolución del análisis. No hace falta más para localizar la caja. */
const MUESTRA = 200;
/** Fracción de píxeles opacos que se exige para dar la caja por buena. */
const OPACIDAD_MINIMA = 0.985;
/** Lado del relleno que se guarda. Se ve al 16 % de opacidad: no pide más. */
const LADO = 800;

/**
 * Mayor caja cuadrada casi opaca. Se calcula sobre una imagen integral, así que
 * consultar la cobertura de cualquier caja cuesta lo mismo sea del tamaño que sea.
 */
async function cajaConTextura(fichero) {
  const { data } = await sharp(fichero)
    .ensureAlpha()
    .resize(MUESTRA, MUESTRA, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const n = MUESTRA;
  const integral = new Float64Array((n + 1) * (n + 1));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const opaco = data[(y * n + x) * 4 + 3] > 200 ? 1 : 0;
      integral[(y + 1) * (n + 1) + (x + 1)] =
        opaco +
        integral[y * (n + 1) + (x + 1)] +
        integral[(y + 1) * (n + 1) + x] -
        integral[y * (n + 1) + x];
    }
  }
  const cobertura = (x0, y0, lado) =>
    (integral[(y0 + lado) * (n + 1) + (x0 + lado)] -
      integral[y0 * (n + 1) + (x0 + lado)] -
      integral[(y0 + lado) * (n + 1) + x0] +
      integral[y0 * (n + 1) + x0]) /
    (lado * lado);

  for (let lado = n - 10; lado >= 40; lado -= 2) {
    for (let y0 = 0; y0 + lado <= n; y0 += 4) {
      for (let x0 = 0; x0 + lado <= n; x0 += 4) {
        if (cobertura(x0, y0, lado) >= OPACIDAD_MINIMA) return { x0, y0, lado };
      }
    }
  }
  return null;
}

mkdirSync(SALIDA, { recursive: true });

for (const nombre of CATEGORIAS) {
  const origen = join(ENTRADA, `${nombre}.png`);
  const caja = await cajaConTextura(origen);
  if (!caja) {
    console.error(`  ${nombre}: sin zona opaca suficiente`);
    process.exitCode = 1;
    continue;
  }

  const { width, height } = await sharp(origen).metadata();
  const region = {
    left: Math.round((caja.x0 / MUESTRA) * width),
    top: Math.round((caja.y0 / MUESTRA) * height),
    width: Math.round((caja.lado / MUESTRA) * width),
    height: Math.round((caja.lado / MUESTRA) * height),
  };

  const destino = join(SALIDA, `${nombre}.jpg`);
  await sharp(origen)
    .extract(region)
    .resize(LADO, LADO)
    .flatten({ background: '#13110f' })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(destino);

  console.log(
    `  ${nombre.padEnd(10)} recorte ${region.width}×${region.height} → ${LADO}×${LADO}` +
      `  ${Math.round(statSync(destino).size / 1024)} kB`,
  );
}

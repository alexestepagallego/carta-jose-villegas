/**
 * Recorta el fondo del logo con alfa real.
 *
 * El PNG que entregó el cliente no tiene transparencia: el logo va sobre un
 * blanco ~#fdfdfd. En el prototipo se disimulaba con `mix-blend-mode: multiply`,
 * pero el contenedor del logo crea un contexto de apilamiento y el blend queda
 * aislado, así que se veía un rectángulo blanco sobre el papel.
 *
 * En vez de parchearlo con CSS, se recorta el fondo de una vez: relleno por
 * difusión desde los bordes sobre píxeles casi blancos y sin saturación, de modo
 * que los blancos ENCERRADOS (la rotulación "José Villegas") se conservan.
 *
 *   node scripts/prepare-logo.mjs ../assets/logo.png src/assets/logo.png
 */
import sharp from 'sharp';

/** Un píxel cuenta como fondo si es casi blanco y prácticamente gris. */
const MIN_LUMA = 225;
const MAX_CHROMA = 14;

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('uso: prepare-logo.mjs <entrada> <salida>');
  process.exit(1);
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

const isBackground = (i) => {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return Math.min(r, g, b) >= MIN_LUMA && Math.max(r, g, b) - Math.min(r, g, b) <= MAX_CHROMA;
};

// Difusión desde el marco: solo se vacía el fondo conectado con el exterior.
const seen = new Uint8Array(width * height);
const queue = [];
for (let x = 0; x < width; x++) {
  queue.push(x, (height - 1) * width + x);
}
for (let y = 0; y < height; y++) {
  queue.push(y * width, y * width + width - 1);
}

const mask = Buffer.alloc(width * height, 255); // 255 = opaco
let head = 0;
while (head < queue.length) {
  const p = queue[head++];
  if (seen[p] || !isBackground(p * 4)) continue;
  seen[p] = 1;
  mask[p] = 0;

  const x = p % width;
  const y = (p - x) / width;
  if (x > 0) queue.push(p - 1);
  if (x < width - 1) queue.push(p + 1);
  if (y > 0) queue.push(p - width);
  if (y < height - 1) queue.push(p + width);
}

// El PNG entregado trae un cursor del ratón incrustado arriba, que el fondo
// blanco disimulaba. Al recortar queda como una isla opaca suelta: se etiquetan
// las componentes conexas de lo opaco y se descartan las residuales.
const MIN_COMPONENT = 0.005; // 0,5% del lienzo
const label = new Int32Array(width * height).fill(-1);
const sizes = [];
for (let start = 0; start < width * height; start++) {
  if (mask[start] === 0 || label[start] !== -1) continue;
  const id = sizes.length;
  let size = 0;
  const stack = [start];
  label[start] = id;
  while (stack.length) {
    const q = stack.pop();
    size++;
    const x = q % width;
    const y = (q - x) / width;
    const push = (r) => {
      if (mask[r] !== 0 && label[r] === -1) {
        label[r] = id;
        stack.push(r);
      }
    };
    if (x > 0) push(q - 1);
    if (x < width - 1) push(q + 1);
    if (y > 0) push(q - width);
    if (y < height - 1) push(q + width);
  }
  sizes.push(size);
}

const minSize = width * height * MIN_COMPONENT;
const dropped = sizes.filter((size) => size < minSize);
for (let p = 0; p < width * height; p++) {
  const id = label[p];
  if (id !== -1 && sizes[id] < minSize) mask[p] = 0;
}

// Un desenfoque mínimo suaviza el borde del recorte (antialias).
const alpha = await sharp(mask, { raw: { width, height, channels: 1 } })
  .blur(0.8)
  .toColourspace('b-w')
  .raw()
  .toBuffer();

// Salvaguarda: si sharp devolviera más de un canal, se lee solo el primero.
const stride = alpha.length / (width * height);

// El alfa se escribe sobre el propio búfer RGBA: joinChannel sobre un raw no
// marca el canal como alfa y sharp lo descarta al guardar el PNG.
for (let p = 0; p < width * height; p++) data[p * 4 + 3] = alpha[p * stride];

await sharp(data, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(output);

const cleared = mask.reduce((n, v) => n + (v === 0 ? 1 : 0), 0);
console.log(
  `fondo recortado: ${((cleared / (width * height)) * 100).toFixed(1)}% de ${width}×${height} · ` +
    `componentes conservadas: ${sizes.length - dropped.length} · ` +
    `islas descartadas: ${dropped.length} (${dropped.join(', ') || 'ninguna'} px)`,
);

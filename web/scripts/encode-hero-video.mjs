/**
 * Prepara el bucle de fondo de la portada a partir del vídeo del cliente.
 *
 *   node scripts/encode-hero-video.mjs <entrada> [nombre] [--fundido=1.0]
 *
 * Hace cuatro cosas:
 *
 * 1. Quita la pista de audio. El autoplay exige silencio y la pista solo pesa.
 * 2. Cierra el bucle con un fundido cruzado. Un vídeo generado no suele terminar
 *    donde empieza, y el salto se nota en cada vuelta; se solapa la cola sobre la
 *    cabeza con la opacidad bajando, y en fuego y humo el empalme desaparece.
 * 3. Codifica H.264 con yuv420p y +faststart —lo único que iOS reproduce de forma
 *    fiable sin esperar a la descarga completa— y un VP9 al lado, que pesa menos
 *    donde se admite.
 * 4. Saca el póster: es lo que se ve mientras carga y lo que queda fijo para quien
 *    ha pedido reducir el movimiento.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const entrada = args.find((a) => !a.startsWith('--'));
const nombre = args.filter((a) => !a.startsWith('--'))[1] ?? 'portada';
const fundido = Number(args.find((a) => a.startsWith('--fundido='))?.split('=')[1] ?? 1.0);

if (!entrada) {
  console.error('uso: encode-hero-video.mjs <entrada> [nombre] [--fundido=segundos]');
  process.exit(1);
}

const OUT = 'public/portada';
mkdirSync(OUT, { recursive: true });

const probe = (campo) =>
  execFileSync('ffprobe', ['-v', 'error', '-show_entries', campo, '-of', 'default=nw=1:nk=1', entrada])
    .toString()
    .trim()
    .split('\n')[0];

const duracion = Number(probe('format=duration'));
const bucle = duracion - fundido;
if (bucle <= fundido) {
  console.error(`el vídeo dura ${duracion}s: es muy corto para un fundido de ${fundido}s`);
  process.exit(1);
}

/**
 * Bucle de `bucle` segundos: se toman los primeros `bucle` y encima se superpone
 * la cola (de `bucle` a `duracion`) con la opacidad cayendo de 1 a 0. Así el
 * último fotograma enlaza exactamente con el primero.
 */
const filtro =
  `[0:v]trim=0:${bucle},setpts=PTS-STARTPTS[cabeza];` +
  `[0:v]trim=${bucle}:${duracion},setpts=PTS-STARTPTS,` +
  `format=yuva420p,fade=t=out:st=0:d=${fundido}:alpha=1[cola];` +
  `[cabeza][cola]overlay=eof_action=pass,format=yuv420p[v]`;

const comun = ['-y', '-i', entrada, '-filter_complex', filtro, '-map', '[v]', '-an'];

execFileSync('ffmpeg', [...comun, '-c:v', 'libx264', '-crf', '30', '-preset', 'slow',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(OUT, `${nombre}.mp4`)], { stdio: 'ignore' });

// VP9 aguanta un CRF alto aquí: el vídeo se ve al 22 % de opacidad y con algo de
// desaturación, así que los artefactos no llegan a pantalla. A 38 pesaba más que
// el H.264, y al ir primero en las fuentes habría sido el peor de los dos mundos.
execFileSync('ffmpeg', [...comun, '-c:v', 'libvpx-vp9', '-crf', '46', '-b:v', '0',
  '-pix_fmt', 'yuv420p', '-row-mt', '1', join(OUT, `${nombre}.webm`)], { stdio: 'ignore' });

// Póster: un fotograma ya dentro del bucle, no el primero, que puede ser un negro
// de entrada. A un tercio del recorrido suele haber ya algo que enseñar.
execFileSync('ffmpeg', ['-y', '-ss', String(bucle / 3), '-i', entrada, '-frames:v', '1',
  '-q:v', '4', join(OUT, `${nombre}.jpg`)], { stdio: 'ignore' });

console.log(`  bucle de ${bucle.toFixed(2)}s con fundido de ${fundido}s`);
for (const ext of ['mp4', 'webm', 'jpg']) {
  const kb = Math.round(statSync(join(OUT, `${nombre}.${ext}`)).size / 1024);
  console.log(`  ${nombre}.${ext.padEnd(5)} ${String(kb).padStart(5)} kB`);
}

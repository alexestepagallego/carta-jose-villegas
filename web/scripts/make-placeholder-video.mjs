/**
 * Genera el vídeo de marcador de posición de la portada.
 *
 * El vídeo definitivo lo graba el cliente (un chef amasando, metiendo la masa al
 * horno…). Esto solo ocupa el hueco para que el montaje se pueda ver y probar
 * antes de tenerlo: un resplandor cálido que deriva despacio, como la luz de un
 * horno, con el texto de aviso encima.
 *
 * El bucle no tiene costura por construcción: todo el movimiento recorre un
 * número entero de ciclos a lo largo de la duración, así que el último fotograma
 * enlaza con el primero.
 *
 *   node scripts/make-placeholder-video.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const W = 720;
const H = 1280;
const FPS = 24;
const SECONDS = 5;
const FRAMES = FPS * SECONDS;
const OUT = 'public/portada';

/** Fondo de la carta, para que el marcador no desentone al 22 % de opacidad. */
const BG = '#13110f';
const GLOW = '#f27f5c';

const frame = (i) => {
  const t = i / FRAMES; // 0…1, un ciclo completo
  const ang = t * Math.PI * 2;
  const blob = (cx, cy, r, color, alpha) => `
    <radialGradient id="g${cx | 0}${cy | 0}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color}" stop-opacity="${alpha}"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#g${cx | 0}${cy | 0})"/>`;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${BG}"/>
    <defs></defs>
    ${blob(W * 0.5 + Math.cos(ang) * W * 0.22, H * 0.42 + Math.sin(ang) * H * 0.10, W * 0.62, GLOW, 0.55)}
    ${blob(W * 0.5 - Math.cos(ang) * W * 0.16, H * 0.66 - Math.sin(ang * 2) * H * 0.06, W * 0.45, '#d79700', 0.35)}
    <g font-family="Helvetica, Arial, sans-serif" text-anchor="middle" fill="#f0eeeb">
      <text x="${W / 2}" y="${H * 0.5}" font-size="34" font-weight="700" letter-spacing="6">MARCADOR DE POSICIÓN</text>
      <text x="${W / 2}" y="${H * 0.5 + 46}" font-size="24" opacity="0.7">vídeo de portada</text>
      <text x="${W / 2}" y="${H * 0.5 + 96}" font-size="19" opacity="0.5">sustituir por el bucle del chef</text>
    </g>
  </svg>`);
};

const dir = mkdtempSync(join(tmpdir(), 'portada-'));
try {
  for (let i = 0; i < FRAMES; i++) {
    // Sin alfa: con canal alfa, VP9 intenta yuva420p y no abre el codificador.
    await sharp(frame(i)).flatten({ background: BG }).png().toFile(join(dir, String(i).padStart(4, '0') + '.png'));
  }

  mkdirSync(OUT, { recursive: true });
  const entrada = ['-y', '-framerate', String(FPS), '-i', join(dir, '%04d.png')];

  // H.264 para compatibilidad universal; yuv420p y faststart para que reproduzca
  // en iOS y empiece sin esperar a descargar el fichero entero.
  execFileSync('ffmpeg', [...entrada, '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-crf', '30', '-movflags', '+faststart', join(OUT, 'placeholder.mp4')], { stdio: 'ignore' });

  // VP9 pesa bastante menos donde se admite.
  execFileSync('ffmpeg', [...entrada, '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p',
    '-crf', '42', '-b:v', '0', '-row-mt', '1',
    join(OUT, 'placeholder.webm')], { stdio: 'ignore' });

  // Póster: primer fotograma. Es lo que se ve con movimiento reducido.
  await sharp(frame(0)).jpeg({ quality: 72 }).toFile(join(OUT, 'placeholder.jpg'));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const { statSync } = await import('node:fs');
for (const f of ['placeholder.mp4', 'placeholder.webm', 'placeholder.jpg']) {
  console.log(`  ${f.padEnd(18)} ${Math.round(statSync(join(OUT, f)).size / 1024)} kB`);
}

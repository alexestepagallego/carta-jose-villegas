// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages sirve el sitio bajo /carta-jose-villegas/, no en la raíz del
// dominio. El workflow de despliegue define estas dos variables; en local y en
// cualquier host con dominio propio se quedan vacías y el sitio vive en "/".
const site = process.env.SITE_URL;
const base = process.env.BASE_PATH;

export default defineConfig({
  site,
  base,
  image: {
    // Las fotos se colocan con tamaños fijos en px y se animan; nada de layout responsive.
    layout: 'none',
  },
  build: {
    // Una sola página: el CSS va inline y ahorra un round-trip en el primer escaneo del QR.
    inlineStylesheets: 'always',
  },
});

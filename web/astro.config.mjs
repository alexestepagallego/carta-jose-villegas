// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Descomenta y pon el dominio definitivo antes de publicar (canonical + og:url).
  // site: 'https://carta.pizzajosevillegas.es',
  image: {
    // Las fotos se colocan con tamaños fijos en px y se animan; nada de layout responsive.
    layout: 'none',
  },
  build: {
    // Una sola página: el CSS va inline y ahorra un round-trip en el primer escaneo del QR.
    inlineStylesheets: 'always',
  },
});

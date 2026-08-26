# Carta digital · Pizza José Villegas

Carta de restaurante para móvil: un scroll con portada, índice de categorías en
franjas triangulares y una ficha a pantalla completa por categoría. Diseñada a
393 × 852 y pensada para abrirse desde un QR en mesa.

**En vivo: https://alexestepagallego.github.io/carta-jose-villegas/**

El repositorio tiene dos mitades:

| | |
|---|---|
| **`web/`** | La implementación. Astro, sitio estático. [Cómo arrancarlo y por qué está montado así](web/README.md). |
| **Raíz** | El paquete de handoff de diseño: [`HANDOFF.md`](HANDOFF.md) con la especificación completa (geometría, tokens, comportamiento), `index.html` como prototipo de referencia en HTML plano y `assets/` con las imágenes del cliente. |

Empieza por `web/`. El handoff está al lado para consultar el porqué de cada
valor —los números de la geometría de las franjas, los tokens de color, los
copys— y no como algo que haya que integrar.

## Estado

Funciona y está verificado en navegador. Pendiente antes de publicar de verdad:

- El vídeo en bucle de la portada, que graba el cliente: por ahora hay un
  marcador de posición generado.
- La tabla oficial de alérgenos por plato (se retiraron a propósito: deducirlos de
  los ingredientes producía afirmaciones falsas).
- Confirmar con el restaurante las erratas de la carta, que se transcriben
  literalmente.
- El logo limpio y vectorial: el PNG entregado no tiene alfa y trae un cursor del
  ratón incrustado. `web/scripts/prepare-logo.mjs` lo parchea.

Los detalles están en [`web/README.md`](web/README.md).

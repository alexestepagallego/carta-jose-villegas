/**
 * Bucle de fondo de la portada.
 *
 * El vídeo va en autoplay, y eso no es aceptable para quien ha pedido reducir el
 * movimiento: en ese caso se detiene y se queda el póster, que es el primer
 * fotograma. Se atiende también al cambio de preferencia en caliente, porque en
 * iOS y macOS se puede activar sin recargar la página.
 */
export function initHeroVideo(root: ParentNode = document): () => void {
  const video = root.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!video) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const apply = () => {
    if (reduced.matches) {
      video.pause();
      video.currentTime = 0;
    } else {
      // Puede rechazarse (ahorro de batería, política del navegador): el póster
      // se queda en su sitio y la portada sigue funcionando igual.
      void video.play().catch(() => {});
    }
  };

  apply();
  reduced.addEventListener('change', apply);

  return () => reduced.removeEventListener('change', apply);
}

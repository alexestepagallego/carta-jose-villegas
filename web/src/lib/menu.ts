/**
 * Estado y comportamiento de la carta en el cliente.
 *
 * Todo el contenido llega ya renderizado desde el build; aquí solo se resuelve la
 * geometría del índice de categorías y la apertura de la ficha.
 *
 * La geometría va ligada a la posición del scroll, no a transiciones CSS por
 * tiempo: la posición se lee como un número continuo (2,4 = "entre la 2 y la 3")
 * y las franjas se redibujan por fotograma. Con transiciones el índice iba por
 * detrás del dedo en móvil —el snap táctil se resuelve casi de golpe y la
 * animación de 0,62 s llegaba tarde—, y se veía como un salto.
 *
 * Encima, la posición dibujada persigue a la real con un suavizado exponencial,
 * porque hacen falta las dos cosas: arrastrando con el dedo el scroll es continuo
 * y el suavizado apenas se nota, pero con rueda o trackpad el snap obligatorio
 * salta de anclaje a anclaje sin pasar por el medio, y sin suavizado el salto se
 * vería igual de brusco en el escritorio.
 */
import {
  layout,
  stackShift,
  activeWeights,
  photoPlacement,
  photoFilter,
  fillOpacity,
} from './geometry';

interface CategoryParts {
  band: HTMLElement;
  /** Relleno fotográfico de la cuña, recortado por el clip-path del botón. */
  fill: HTMLElement;
  photo: HTMLElement;
  name: HTMLElement;
  more: HTMLElement;
  /** Tamaño nominal de la foto activa, leído del marcado. */
  w: number;
  h: number;
}

/** Umbral de scroll, en pantallas, a partir del cual aparece la cabecera. */
const BAR_THRESHOLD = 0.35;

/**
 * Fracción de la distancia pendiente que se recorre por fotograma a 60 fps.
 * Con 0,22 un salto de una categoría se resuelve en ~250 ms y, arrastrando, el
 * retraso respecto al dedo se queda en tres o cuatro fotogramas.
 */
const RESPONSE = 0.22;

/** Duración del recorrido al tocar una franja en reposo. */
const TAP_TRAVEL_MS = 520;

/**
 * La curva de salida del diseño, cubic-bezier(.32, .72, 0, 1), resuelta por
 * bisección: solo hace falta y(x), y con ocho pasos el error es inapreciable.
 */
function easeOut(x: number): number {
  const bezier = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 8; k++) {
    const mid = (lo + hi) / 2;
    if (bezier(mid, 0.32, 0) < x) lo = mid;
    else hi = mid;
  }
  return bezier((lo + hi) / 2, 0.72, 1);
}

export function initMenu(root: ParentNode = document): () => void {
  const scroller = root.querySelector<HTMLElement>('[data-scroller]');
  const bar = root.querySelector<HTMLElement>('[data-bar]');
  const bands = root.querySelector<HTMLElement>('[data-bands]');
  const groups = Array.from(root.querySelectorAll<HTMLElement>('.cat'));
  const sheets = Array.from(root.querySelectorAll<HTMLElement>('[data-sheet]'));

  if (!scroller || !bar || !bands || groups.length === 0) return () => {};

  const parts: CategoryParts[] = groups.map((group) => {
    const pick = <T extends HTMLElement>(sel: string) => group.querySelector<T>(sel)!;
    const photo = pick('[data-photo]');
    return {
      band: pick('[data-band]'),
      fill: pick('[data-fill]'),
      photo,
      name: pick('[data-name]'),
      more: pick('[data-more]'),
      w: Number(photo.dataset.w),
      h: Number(photo.dataset.h),
    };
  });

  const n = parts.length;
  /** Categoría bajo el scroll, redondeada: la que responde al toque. */
  let active = 0;
  let open: number | null = null;

  /** Posición real, según el scroll: 0 = primera categoría, n − 1 = última. */
  function target(): number {
    const viewport = scroller!.clientHeight || 1;
    // La portada ocupa la primera pantalla; a partir de ahí, una por categoría.
    return Math.min(n - 1, Math.max(0, (scroller!.scrollTop - viewport) / viewport));
  }

  /** Posición efectivamente dibujada, que persigue a la real. */
  let shown = target();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function render(at: number) {
    const geometry = layout(at, n);
    const weights = activeWeights(at, n);

    // El lienzo es más alto que la pantalla: se sube para centrar la activa.
    bands!.style.setProperty('--shift', String(stackShift(geometry, at)));

    const rounded = Math.round(at);
    const changed = rounded !== active;
    active = rounded;

    parts.forEach((part, i) => {
      const on = i === active;
      const weight = weights[i];
      const { clipPath, topEdge, bottomEdge } = geometry[i];

      part.band.style.clipPath = clipPath;

      // El relleno se ciñe a la caja de su franja; la cuña la recorta el botón.
      part.fill.style.top = `${topEdge}%`;
      part.fill.style.height = `${(bottomEdge - topEdge).toFixed(3)}%`;
      part.fill.style.opacity = String(fillOpacity(weight));

      const photo = photoPlacement(geometry[i], part, weight);
      Object.assign(part.photo.style, photo);
      part.photo.style.filter = photoFilter(weight);

      part.name.style.top = `calc(${topEdge}% + 11px)`;
      part.more.style.top = `calc(${topEdge}% + 47px)`;

      if (!changed) return;
      // Color, tipografía y opacidad sí cambian de golpe con su transición CSS:
      // no son posicionales, así que no compiten con el desplazamiento.
      part.band.classList.toggle('is-on', on);
      part.photo.classList.toggle('is-on', on);
      part.name.classList.toggle('is-on', on);
      part.more.classList.toggle('is-on', on);
      // En reposo la franja lleva a su categoría; ya activa, abre la ficha.
      const label = on ? part.band.dataset.labelActive : part.band.dataset.labelIdle;
      if (label) part.band.setAttribute('aria-label', label);
      if (on) part.band.setAttribute('aria-haspopup', 'dialog');
      else part.band.removeAttribute('aria-haspopup');
    });

    bar!.classList.toggle(
      'is-on',
      scroller!.scrollTop > (scroller!.clientHeight || 1) * BAR_THRESHOLD,
    );
  }

  // El bucle vive mientras el scroll se mueva o quede distancia por recorrer.
  let frame = 0;
  let last = 0;

  function tick(now: number) {
    const to = target();
    const dt = last ? Math.min(now - last, 50) : 1000 / 60;
    last = now;

    // Corregido por tiempo: el suavizado no depende de los fps del dispositivo.
    // Con movimiento reducido no se suaviza: se salta directo a su sitio.
    const k = reducedMotion.matches ? 1 : 1 - Math.pow(1 - RESPONSE, dt / (1000 / 60));
    shown += (to - shown) * k;
    if (Math.abs(to - shown) < 0.0005) shown = to;

    render(shown);

    if (shown !== to) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = 0;
      last = 0;
    }
  }

  function onScroll() {
    if (!frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  /**
   * Lleva el scroll al anclaje de una categoría; el bucle de render hace el resto.
   *
   * El recorrido se anima a mano en vez de con `behavior: "smooth"`: el
   * comportamiento del scroll suave nativo varía entre navegadores y encima
   * choca con `scroll-snap-type: mandatory`, que corrige las posiciones
   * intermedias. Se desactiva el snap mientras dura el recorrido y se restaura
   * al llegar, así el resultado es el mismo en todos.
   */
  let travel = 0;

  function goTo(i: number) {
    const viewport = scroller!.clientHeight || 1;
    const to = viewport * (i + 1);
    const from = scroller!.scrollTop;

    cancelAnimationFrame(travel);
    if (reducedMotion.matches || from === to) {
      scroller!.scrollTop = to;
      return;
    }

    const start = performance.now();
    scroller!.style.scrollSnapType = 'none';

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / TAP_TRAVEL_MS);
      scroller!.scrollTop = from + (to - from) * easeOut(t);
      if (t < 1) {
        travel = requestAnimationFrame(step);
      } else {
        travel = 0;
        scroller!.scrollTop = to;
        scroller!.style.scrollSnapType = '';
      }
    };
    travel = requestAnimationFrame(step);
  }

  /**
   * Si el dedo o la rueda se mueven, el recorrido automático se aparta. Se
   * escucha el movimiento y no el inicio del gesto: un toque en una franja
   * también empieza por pointerdown/touchstart y se cancelaría a sí mismo.
   */
  function cancelTravel() {
    if (!travel) return;
    cancelAnimationFrame(travel);
    travel = 0;
    scroller!.style.scrollSnapType = '';
  }

  function openSheet(i: number) {
    if (open === i) return;
    open = i;
    sheets.forEach((sheet, j) => sheet.classList.toggle('is-open', i === j));
    sheets[i].scrollTop = 0;
    sheets[i].querySelector<HTMLElement>('[data-close]')?.focus();
  }

  function closeSheet() {
    if (open === null) return;
    // El contenido de la ficha se queda en su sitio durante la animación de salida.
    sheets[open].classList.remove('is-open');
    parts[open].band.focus();
    open = null;
  }

  // Dos pasos: el primer toque en una franja en reposo la trae al frente (se
  // amplía y toma color); solo la que ya está activa abre la ficha.
  parts.forEach((part, i) =>
    part.band.addEventListener('click', () => (i === active ? openSheet(i) : goTo(i))),
  );
  sheets.forEach((sheet) =>
    sheet.querySelector<HTMLElement>('[data-close]')?.addEventListener('click', closeSheet),
  );

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeSheet();
  };

  const onResize = () => {
    shown = target();
    render(shown);
  };

  scroller.addEventListener('scroll', onScroll, { passive: true });
  scroller.addEventListener('touchmove', cancelTravel, { passive: true });
  scroller.addEventListener('wheel', cancelTravel, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('keydown', onKeydown);

  render(shown);

  return () => {
    cancelAnimationFrame(frame);
    cancelTravel();
    scroller.removeEventListener('scroll', onScroll);
    scroller.removeEventListener('touchmove', cancelTravel);
    scroller.removeEventListener('wheel', cancelTravel);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onKeydown);
  };
}

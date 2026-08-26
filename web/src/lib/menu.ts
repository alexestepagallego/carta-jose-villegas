/**
 * Estado y comportamiento de la carta en el cliente.
 *
 * Todo el contenido llega ya renderizado desde el build; aquí solo se resuelve
 * qué categoría está activa (según el scroll), la geometría de las franjas y la
 * apertura de la ficha.
 */
import { layout, IDLE_PHOTO_SCALE, PHOTO_OFFSET } from './geometry';

interface CategoryParts {
  band: HTMLElement;
  photo: HTMLElement;
  name: HTMLElement;
  more: HTMLElement;
  /** Tamaño nominal de la foto activa, leído del marcado. */
  w: number;
  h: number;
}

/** Umbral de scroll, en pantallas, a partir del cual aparece la cabecera. */
const BAR_THRESHOLD = 0.35;

export function initMenu(root: ParentNode = document): () => void {
  const scroller = root.querySelector<HTMLElement>('[data-scroller]');
  const bar = root.querySelector<HTMLElement>('[data-bar]');
  const groups = Array.from(root.querySelectorAll<HTMLElement>('.cat'));
  const sheets = Array.from(root.querySelectorAll<HTMLElement>('[data-sheet]'));

  if (!scroller || !bar || groups.length === 0) return () => {};

  const parts: CategoryParts[] = groups.map((group) => {
    const pick = <T extends HTMLElement>(sel: string) => group.querySelector<T>(sel)!;
    const photo = pick('[data-photo]');
    return {
      band: pick('[data-band]'),
      photo,
      name: pick('[data-name]'),
      more: pick('[data-more]'),
      w: Number(photo.dataset.w),
      h: Number(photo.dataset.h),
    };
  });

  const n = parts.length;
  let active = 0;
  let open: number | null = null;

  function applyLayout() {
    const geometry = layout(active, n);

    parts.forEach((part, i) => {
      const on = i === active;
      const { clipPath, topEdge } = geometry[i];

      part.band.style.clipPath = clipPath;
      part.band.classList.toggle('is-on', on);

      part.photo.classList.toggle('is-on', on);
      part.photo.style.top = `calc(${topEdge}% + ${on ? PHOTO_OFFSET.active : PHOTO_OFFSET.idle}px)`;
      part.photo.style.width = `${on ? part.w : Math.round(part.w * IDLE_PHOTO_SCALE)}px`;
      part.photo.style.height = `${on ? part.h : Math.round(part.h * IDLE_PHOTO_SCALE)}px`;

      part.name.classList.toggle('is-on', on);
      part.name.style.top = `calc(${topEdge}% + 11px)`;
      part.more.classList.toggle('is-on', on);
      part.more.style.top = `calc(${topEdge}% + 47px)`;
    });
  }

  function syncToScroll() {
    const viewport = scroller!.clientHeight || 1;
    const top = scroller!.scrollTop;

    bar!.classList.toggle('is-on', top > viewport * BAR_THRESHOLD);

    // La portada ocupa la primera pantalla; a partir de ahí, una por categoría.
    const i = Math.min(n - 1, Math.max(0, Math.round((top - viewport) / viewport)));
    if (i !== active) {
      active = i;
      applyLayout();
    }
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

  parts.forEach((part, i) => part.band.addEventListener('click', () => openSheet(i)));
  sheets.forEach((sheet) =>
    sheet.querySelector<HTMLElement>('[data-close]')?.addEventListener('click', closeSheet),
  );

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeSheet();
  };

  scroller.addEventListener('scroll', syncToScroll, { passive: true });
  window.addEventListener('resize', syncToScroll);
  document.addEventListener('keydown', onKeydown);

  applyLayout();
  syncToScroll();

  return () => {
    scroller.removeEventListener('scroll', syncToScroll);
    window.removeEventListener('resize', syncToScroll);
    document.removeEventListener('keydown', onKeydown);
  };
}

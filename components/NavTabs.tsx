"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

const TABS = [
  { href: "/", label: "Inicio" },
  { href: "/presupuestos", label: "Presupuestos" },
  { href: "/historial", label: "Historial" },
];

const LIST = "grid grid-cols-3 sm:flex sm:gap-1";
const TAB = "rounded-full px-3.5 py-1.5 text-center text-sm font-medium";

// La pastilla activa es una copia de las pestañas con colores invertidos,
// recortada con clip-path sobre la pestaña actual: así el color cambia
// exactamente en el borde mientras se desliza.
export default function NavTabs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const active = TABS.findIndex((tab) => tab.href === pathname);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const overlay = overlayRef.current;
    if (!list || !overlay) return;

    function update() {
      const tab = list!.querySelectorAll<HTMLElement>("[data-tab]")[active];
      if (!tab) {
        overlay!.dataset.hidden = "true";
        return;
      }
      const right = list!.offsetWidth - tab.offsetLeft - tab.offsetWidth;
      overlay!.style.clipPath = `inset(0 ${right}px 0 ${tab.offsetLeft}px round 999px)`;
      overlay!.dataset.hidden = "false";
    }

    update();
    // Recién después de la primera medición habilitamos la transición, para que no barra al cargar.
    const frame = requestAnimationFrame(() => (overlay.dataset.ready = "true"));
    const observer = new ResizeObserver(() => {
      delete overlay.dataset.ready;
      update();
      requestAnimationFrame(() => (overlay.dataset.ready = "true"));
    });
    observer.observe(list);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active]);

  return (
    <nav aria-label="Principal" className={`relative ${className}`}>
      <div ref={listRef} className={LIST}>
        {TABS.map((tab, index) => (
          <Link
            key={tab.href}
            href={tab.href}
            data-tab
            aria-current={index === active ? "page" : undefined}
            className={`press ${TAB} text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div ref={overlayRef} aria-hidden="true" data-hidden="true" className={`nav-pill pointer-events-none absolute inset-0 ${LIST}`}>
        {TABS.map((tab) => (
          <span key={tab.href} className={`${TAB} bg-brand-950 text-brand-50 dark:bg-brand-300 dark:text-brand-950`}>
            {tab.label}
          </span>
        ))}
      </div>
    </nav>
  );
}

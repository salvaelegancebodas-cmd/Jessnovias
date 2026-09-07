"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/novias", label: "Novias" },
  { href: "/servicios", label: "Servicios" },
  { href: "/galeria", label: "Galería" },
  { href: "/sobre-jess", label: "Sobre Jess" },
  { href: "/opiniones", label: "Opiniones" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacto", label: "Contacto" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur border-b border-champagne">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5">
          <Link href="/" className="font-serif text-xl tracking-wide2 uppercase">
            Jess Novias Makeup
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm tracking-wide2 uppercase">
            {NAV_ITEMS.slice(1, -1).map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-warm-beige transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/reservar"
            className="hidden lg:inline-block border border-soft-black px-5 py-2 text-xs tracking-wide2 uppercase hover:bg-soft-black hover:text-ivory transition-colors"
          >
            Reservar fecha
          </Link>

          <button
            aria-label="Abrir menú"
            className="lg:hidden text-sm tracking-wide2 uppercase"
            onClick={() => setOpen(true)}
          >
            Menú
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-ivory flex flex-col">
          <div className="flex justify-end px-6 py-5">
            <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="text-sm tracking-wide2 uppercase">
              Cerrar
            </button>
          </div>
          <nav className="flex flex-col items-center gap-6 mt-10 text-lg font-serif">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* CTA fijo inferior en móvil (regla #31 del brief) */}
      <Link
        href="/reservar"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-soft-black text-ivory text-center py-4 text-xs tracking-wide2 uppercase"
      >
        Comprobar disponibilidad
      </Link>
    </>
  );
}

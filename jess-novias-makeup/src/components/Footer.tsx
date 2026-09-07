import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-champagne mt-24">
      <div className="mx-auto max-w-6xl px-6 py-16 grid gap-10 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-serif text-lg tracking-wide2 uppercase mb-3">Jess Novias Makeup</p>
          <p className="text-warm-gray">Maquillaje y peluquería de novia · Barcelona, Girona, Tarragona</p>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/servicios">Servicios</Link>
          <Link href="/galeria">Galería</Link>
          <Link href="/opiniones">Opiniones</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <nav className="flex flex-col gap-2">
          <Link href="/politica-de-privacidad">Política de privacidad</Link>
          <Link href="/politica-de-cookies">Política de cookies</Link>
          <Link href="/aviso-legal">Aviso legal</Link>
          <a href={`https://instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM}`} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </nav>
      </div>
    </footer>
  );
}

const MESSAGE = encodeURIComponent(
  "Hola Jess, estoy organizando mi boda y me gustaría consultar disponibilidad para mi fecha."
);

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP;
  if (!number) return null;

  return (
    <a
      href={`https://wa.me/${number}?text=${MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-20 lg:bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-soft-black text-ivory flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
        <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5ZM12 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.7 1 1-3.6-.2-.4A9.7 9.7 0 0 1 2.2 12c0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.1 1 6.9 2.9a9.7 9.7 0 0 1 2.9 6.9c0 5.4-4.4 9.8-9.8 9.8Z" />
      </svg>
    </a>
  );
}

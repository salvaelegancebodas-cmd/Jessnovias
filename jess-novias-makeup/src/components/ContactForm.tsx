"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="text-center">Gracias. Hemos recibido tu mensaje y te responderemos pronto.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-lg mx-auto">
      {/* honeypot antispam, oculto para humanos */}
      <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />

      <input name="name" required placeholder="Nombre" className="border border-champagne px-4 py-3 bg-transparent" />
      <input name="email" type="email" required placeholder="Email" className="border border-champagne px-4 py-3 bg-transparent" />
      <input name="phone" placeholder="Teléfono" className="border border-champagne px-4 py-3 bg-transparent" />
      <input name="weddingDate" type="date" placeholder="Fecha de la boda" className="border border-champagne px-4 py-3 bg-transparent" />
      <input name="location" placeholder="Localidad" className="border border-champagne px-4 py-3 bg-transparent" />
      <input name="service" placeholder="Servicio de interés" className="border border-champagne px-4 py-3 bg-transparent" />
      <textarea name="message" required placeholder="Mensaje" rows={4} className="border border-champagne px-4 py-3 bg-transparent" />

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-soft-black text-ivory px-7 py-3 text-xs tracking-wide2 uppercase disabled:opacity-50"
      >
        {status === "sending" ? "Enviando..." : "Quiero hablar con Jess"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-700">Ha ocurrido un error. Escríbenos por WhatsApp mejor.</p>
      )}
    </form>
  );
}

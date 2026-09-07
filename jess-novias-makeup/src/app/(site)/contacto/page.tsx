import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactoPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="kicker text-center mb-4">Contacto</p>
      <h1 className="text-4xl text-center mb-12">Hablemos de tu boda</h1>
      <ContactForm />
    </section>
  );
}

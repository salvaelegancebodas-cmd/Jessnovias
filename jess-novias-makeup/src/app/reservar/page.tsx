import BookingWizard from "@/components/BookingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reservar fecha" };

export default function ReservarPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="kicker text-center mb-4">Reserva</p>
      <h1 className="text-4xl text-center mb-12">Comprobar disponibilidad</h1>
      <BookingWizard />
    </section>
  );
}

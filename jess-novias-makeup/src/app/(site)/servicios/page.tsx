import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Maquillaje de novia, peinado, pack novia, invitadas, preboda/postboda y servicio a domicilio.",
};

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <p className="kicker text-center mb-4">Servicios</p>
      <h1 className="text-4xl text-center mb-16">Cada servicio, pensado para tu día</h1>

      {services.length === 0 ? (
        <p className="text-center text-warm-gray">
          Los servicios se están configurando. Escríbenos por WhatsApp para consultar disponibilidad.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-8">
          {services.map((s) => (
            <article key={s.id} className="border border-champagne p-10">
              <h2 className="text-2xl mb-3">{s.name}</h2>
              {s.description && <p className="text-warm-gray mb-4">{s.description}</p>}
              <p className="text-sm mb-1">Duración aproximada: {s.durationMin} min</p>
              <p className="text-sm mb-6">
                {s.price ? `${Number(s.price).toFixed(0)} €` : "Precio a consultar"}
              </p>
              <Link href={`/reservar?servicio=${s.slug}`} className="text-xs tracking-wide2 uppercase border-b border-soft-black">
                Consultar disponibilidad
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

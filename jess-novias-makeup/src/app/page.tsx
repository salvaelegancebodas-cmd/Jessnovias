import Link from "next/link";
import { prisma } from "@/lib/db";

// Renderizado dinámico: los datos (servicios, opiniones) vienen de la BD
// y cambian desde el admin, así que no se prerenderiza en el build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [services, reviews] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    prisma.review.findMany({ where: { featured: true }, take: 3 }),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative h-[85vh] min-h-[560px] flex items-end">
        {/* TODO: sustituir por hero.jpg real de Jessica (ver README, placeholders) */}
        <div className="absolute inset-0 bg-champagne/40" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl w-full px-6 pb-16 text-soft-black">
          <p className="kicker mb-4">Jessica Márquez · Bridal Expert</p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] max-w-2xl">
            Tu mejor versión,
            <br />
            en el día más importante
          </h1>
          <p className="mt-6 max-w-md text-warm-gray">
            Maquillaje y peluquería de novia diseñados para ti, para que te sientas tú
            misma, segura y radiante.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/reservar" className="bg-soft-black text-ivory px-7 py-3 text-xs tracking-wide2 uppercase">
              Consultar disponibilidad
            </Link>
            <Link href="/galeria" className="border border-soft-black px-7 py-3 text-xs tracking-wide2 uppercase">
              Ver trabajos
            </Link>
          </div>
          {/* Valoración: dato real configurable en Setting, nunca hardcodeado */}
          <RatingBadge />
        </div>
      </section>

      {/* NOVIAS */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="kicker mb-4">Novias</p>
        <h2 className="text-3xl sm:text-4xl max-w-2xl mx-auto">
          Tu boda empieza mucho antes de llegar al altar.
        </h2>
        <p className="mt-6 max-w-xl mx-auto text-warm-gray">
          El objetivo no es transformarte, sino potenciar tu belleza, respetar tu
          personalidad y conseguir un resultado elegante, duradero y fotogénico.
        </p>
        <ul className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm max-w-2xl mx-auto text-left">
          {[
            "Asesoramiento personalizado",
            "Prueba de maquillaje",
            "Prueba de peinado",
            "Maquillaje día B",
            "Peinado día B",
            "Servicio a domicilio",
            "Equipo profesional",
            "Coordinación de grupos",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <Link href="/novias" className="inline-block mt-10 text-xs tracking-wide2 uppercase border-b border-soft-black">
          Quiero mi fecha
        </Link>
      </section>

      {/* SERVICIOS */}
      {services.length > 0 && (
        <section className="bg-champagne/30 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <p className="kicker mb-4 text-center">Servicios</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {services.map((s) => (
                <div key={s.id} className="bg-ivory p-8 text-center">
                  <h3 className="text-lg">{s.name}</h3>
                  {s.description && <p className="mt-3 text-sm text-warm-gray">{s.description}</p>}
                  <p className="mt-4 text-sm">
                    {s.price ? `${Number(s.price).toFixed(0)} €` : "Consultar"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OPINIONES */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="kicker mb-8">Opiniones</p>
          <div className="grid gap-8 sm:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id}>
                <p aria-hidden="true">{"★".repeat(r.rating)}</p>
                <p className="mt-3 text-sm text-warm-gray">“{r.text}”</p>
                <p className="mt-3 text-xs tracking-wide2 uppercase">{r.authorName}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="bg-soft-black text-ivory text-center py-24 px-6">
        <h2 className="text-3xl sm:text-4xl">Tu tranquilidad también forma parte del look.</h2>
        <Link href="/reservar" className="inline-block mt-8 border border-ivory px-8 py-3 text-xs tracking-wide2 uppercase">
          Reservar fecha
        </Link>
      </section>
    </>
  );
}

async function RatingBadge() {
  const setting = await prisma.setting.findUnique({ where: { key: "reviewsSummary" } });
  if (!setting) return null;
  const { average, count } = JSON.parse(setting.value) as { average: number; count: number };
  return (
    <p className="mt-6 text-xs tracking-wide2 uppercase text-warm-gray">
      {"★".repeat(Math.round(average))} {average.toFixed(1)} · +{count} opiniones
    </p>
  );
}

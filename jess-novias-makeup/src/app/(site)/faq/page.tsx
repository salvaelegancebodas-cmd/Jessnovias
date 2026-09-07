import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="kicker text-center mb-4">FAQ</p>
      <h1 className="text-4xl text-center mb-12">Preguntas frecuentes</h1>

      {faqs.length === 0 ? (
        <p className="text-center text-warm-gray">
          Las preguntas frecuentes se están configurando desde el panel de administración.
        </p>
      ) : (
        <dl className="grid gap-8">
          {faqs.map((f) => (
            <div key={f.id}>
              <dt className="font-serif text-lg mb-2">{f.question}</dt>
              <dd className="text-warm-gray">{f.answer}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

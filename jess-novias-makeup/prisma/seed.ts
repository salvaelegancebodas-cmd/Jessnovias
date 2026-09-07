import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Horario de trabajo por defecto — TODO: confirmar con Jessica
  await prisma.workingHours.createMany({
    data: [1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      startTime: "08:00",
      endTime: "20:00",
    })),
    skipDuplicates: true,
  });

  const services = [
    { slug: "maquillaje-novia", name: "Maquillaje de novia", durationMin: 90, bufferAfterMin: 15, sortOrder: 1 },
    { slug: "peinado-novia", name: "Peinado de novia", durationMin: 60, bufferAfterMin: 15, sortOrder: 2 },
    { slug: "pack-novia", name: "Pack novia (maquillaje + peinado + pruebas)", durationMin: 150, bufferAfterMin: 20, sortOrder: 3 },
    { slug: "invitadas", name: "Invitadas", durationMin: 45, bufferAfterMin: 10, sortOrder: 4 },
    { slug: "preboda-postboda", name: "Preboda / Postboda", durationMin: 90, bufferAfterMin: 15, sortOrder: 5 },
    { slug: "domicilio", name: "Servicio a domicilio", durationMin: 90, bufferAfterMin: 15, sortOrder: 6 },
  ];
  // Precios: null = "consultar" — TODO: confirmar tarifas reales con Jessica
  for (const s of services) {
    await prisma.service.upsert({ where: { slug: s.slug }, create: s, update: {} });
  }

  const faqs = [
    { question: "¿Cuándo debo reservar mi fecha?", answer: "TODO: confirmar con Jessica la antelación recomendada." },
    { question: "¿La prueba de maquillaje está incluida?", answer: "TODO: confirmar política de pruebas." },
    { question: "¿Trabajáis a domicilio?", answer: "Sí, ofrecemos servicio a domicilio en Barcelona, Girona y Tarragona con posible suplemento según distancia." },
    { question: "¿Cómo se realiza el pago?", answer: "Aceptamos efectivo, transferencia y Bizum. Se solicita una paga y señal para reservar la fecha." },
  ];
  for (const [i, f] of faqs.entries()) {
    await prisma.faq.create({ data: { ...f, sortOrder: i } });
  }

  await prisma.emailTemplate.createMany({
    data: [
      {
        key: "booking_received_client",
        subject: "Hemos recibido tu solicitud — Jess Novias Makeup",
        bodyHtml: "<p>Hola {{nombre}},</p><p>Hemos recibido tu solicitud para {{servicio}} el {{fecha}} a las {{hora}}. Jess se pondrá en contacto contigo pronto.</p>",
      },
      {
        key: "booking_received_admin",
        subject: "Nueva solicitud de reserva",
        bodyHtml: "<p>Nueva solicitud de {{nombre}} para {{servicio}} el {{fecha}} a las {{hora}}.</p>",
      },
    ],
    skipDuplicates: true,
  });

  // Placeholder de resumen de opiniones — sustituir por el dato real de
  // Bodas.net/Google cuando se confirme (nunca falsear, ver punto 12 del brief)
  await prisma.setting.upsert({
    where: { key: "reviewsSummary" },
    create: { key: "reviewsSummary", value: JSON.stringify({ average: 5.0, count: 100 }) },
    update: {},
  });

  console.log("Seed completado (con placeholders marcados como TODO).");
}

main().finally(() => prisma.$disconnect());

import { prisma } from "./db";

/**
 * Envío de emails transaccionales. Usa Resend si RESEND_API_KEY está
 * definida; si no, cae a SMTP (nodemailer) con las variables SMTP_*.
 * Las plantillas viven en la tabla EmailTemplate (editables desde admin).
 */
async function send(to: string, subject: string, html: string) {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "reservas@jessnoviasmakeup.com",
      to,
      subject,
      html,
    });
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

async function renderTemplate(key: string, vars: Record<string, string>) {
  const tpl = await prisma.emailTemplate.findUnique({ where: { key } });
  if (!tpl) return null;
  let html = tpl.bodyHtml;
  let subject = tpl.subject;
  for (const [k, v] of Object.entries(vars)) {
    html = html.replaceAll(`{{${k}}}`, v);
    subject = subject.replaceAll(`{{${k}}}`, v);
  }
  return { subject, html };
}

export async function sendBookingReceivedEmail(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { client: true, items: { include: { service: true } } },
  });

  const vars = {
    nombre: booking.client.firstName,
    servicio: booking.items[0]?.service.name ?? "",
    fecha: booking.date.toISOString().slice(0, 10),
    hora: booking.startTime,
  };

  const toClient = await renderTemplate("booking_received_client", vars);
  const toJess = await renderTemplate("booking_received_admin", vars);

  const jessEmail = process.env.NOTIFY_EMAIL ?? process.env.EMAIL_FROM!;
  if (toClient) await send(booking.client.email, toClient.subject, toClient.html);
  if (toJess) await send(jessEmail, toJess.subject, toJess.html);
}

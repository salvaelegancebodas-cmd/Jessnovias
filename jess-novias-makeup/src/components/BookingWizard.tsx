"use client";

import { useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  depositAmount: string | null;
}

const STEPS = ["Servicio", "Fecha", "Hora", "Tus datos", "Confirmación"];

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [slot, setSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ bookingId: string; status: string } | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []));
  }, []);

  // cuenta atrás del hold (checkout)
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!holdExpiresAt) return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.round((holdExpiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0) {
        setError("El tiempo para completar la reserva ha expirado. Vuelve a elegir horario.");
        setStep(2);
        setHoldId(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [holdExpiresAt]);

  async function loadSlots() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/booking/availability?date=${date}&serviceId=${serviceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlots(data.slots ?? []);
      setStep(2);
    } catch (err: any) {
      setError(err.message ?? "No se pudo consultar la disponibilidad");
    } finally {
      setLoading(false);
    }
  }

  async function chooseSlot(s: { startTime: string; endTime: string }) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/booking/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, serviceId, startTime: s.startTime, endTime: s.endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlot(s);
      setHoldId(data.holdId);
      setHoldExpiresAt(Date.now() + data.expiresInSeconds * 1000);
      setStep(3);
    } catch (err: any) {
      setError(err.message ?? "Ese horario ya no está disponible");
      loadSlots();
    } finally {
      setLoading(false);
    }
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      holdId,
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email"),
      phone: form.get("phone"),
      weddingDate: form.get("weddingDate"),
      weddingPlace: form.get("weddingPlace"),
      guestCount: Number(form.get("guestCount") || 1),
      comments: form.get("comments"),
      instagram: form.get("instagram"),
      acceptedPrivacy: form.get("acceptedPrivacy") === "on",
    };

    try {
      const res = await fetch("/api/booking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStep(4);
    } catch (err: any) {
      setError(err.message ?? "No se pudo confirmar la reserva");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* progreso */}
      <ol className="flex justify-between text-[11px] tracking-wide2 uppercase text-warm-gray mb-10">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "text-soft-black" : ""}>
            {s}
          </li>
        ))}
      </ol>

      {error && <p className="mb-6 text-sm text-red-700">{error}</p>}

      {step === 0 && (
        <div className="grid gap-3">
          <p className="mb-2">¿Qué necesitas?</p>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServiceId(s.id);
                setStep(1);
              }}
              className="border border-champagne px-4 py-3 text-left hover:border-soft-black"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4">
          <label className="text-sm">
            Fecha
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full border border-champagne px-4 py-3 mt-1 bg-transparent"
            />
          </label>
          <button
            disabled={!date || loading}
            onClick={loadSlots}
            className="bg-soft-black text-ivory px-6 py-3 text-xs tracking-wide2 uppercase disabled:opacity-50"
          >
            {loading ? "Comprobando..." : "Ver horarios disponibles"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-3 gap-3">
          {slots.length === 0 && <p className="col-span-3 text-warm-gray">No hay horarios disponibles ese día.</p>}
          {slots.map((s) => (
            <button
              key={s.startTime}
              disabled={loading}
              onClick={() => chooseSlot(s)}
              className="border border-champagne px-3 py-3 text-sm hover:border-soft-black disabled:opacity-50"
            >
              {s.startTime}
            </button>
          ))}
        </div>
      )}

      {step === 3 && slot && (
        <form onSubmit={confirm} className="grid gap-4">
          {remaining !== null && (
            <p className="text-xs text-warm-gray">
              Horario reservado temporalmente — te quedan {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")} min para completar tus datos.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" required placeholder="Nombre" className="border border-champagne px-4 py-3 bg-transparent" />
            <input name="lastName" required placeholder="Apellidos" className="border border-champagne px-4 py-3 bg-transparent" />
          </div>
          <input name="email" type="email" required placeholder="Email" className="border border-champagne px-4 py-3 bg-transparent" />
          <input name="phone" required placeholder="Teléfono" className="border border-champagne px-4 py-3 bg-transparent" />
          <input name="weddingDate" type="date" placeholder="Fecha de la boda" className="border border-champagne px-4 py-3 bg-transparent" />
          <input name="weddingPlace" placeholder="Lugar de la boda" className="border border-champagne px-4 py-3 bg-transparent" />
          <input name="guestCount" type="number" min={1} defaultValue={1} placeholder="Número de personas" className="border border-champagne px-4 py-3 bg-transparent" />
          <input name="instagram" placeholder="Instagram (opcional)" className="border border-champagne px-4 py-3 bg-transparent" />
          <textarea name="comments" placeholder="Comentarios" rows={3} className="border border-champagne px-4 py-3 bg-transparent" />

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="acceptedPrivacy" required className="mt-1" />
            He leído y acepto la política de privacidad.
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-soft-black text-ivory px-6 py-3 text-xs tracking-wide2 uppercase disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      )}

      {step === 4 && result && (
        <div className="text-center">
          <h2 className="text-2xl mb-4">Tu solicitud ha sido recibida</h2>
          <p className="text-warm-gray">
            {result.status === "CONFIRMED"
              ? "Tu fecha está reservada."
              : "Hemos recibido tu solicitud y Jess se pondrá en contacto contigo para confirmar todos los detalles."}
          </p>
        </div>
      )}
    </div>
  );
}

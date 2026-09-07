import { cookies } from "next/headers";
import { prisma } from "./db";

/**
 * Placeholder de autenticación admin. En producción, sustituir por
 * NextAuth (credentials provider) o Lucia — aquí se deja una
 * implementación mínima basada en sesión firmada para no bloquear
 * el resto del desarrollo. TODO: reemplazar antes de producción.
 */
export async function requireAdmin() {
  const session = cookies().get("admin_session")?.value;
  if (!session) return null;
  const admin = await prisma.admin.findUnique({ where: { id: session } });
  return admin;
}

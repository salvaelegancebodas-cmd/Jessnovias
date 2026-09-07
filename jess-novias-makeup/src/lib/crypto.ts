import crypto from "crypto";

/**
 * El refresh token de Google NUNCA se guarda en claro.
 * ENCRYPTION_KEY debe ser una cadena hex de 64 caracteres (32 bytes).
 * Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY debe estar definida en .env como una cadena hex de 64 caracteres (32 bytes)"
    );
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // formato almacenado: iv:authTag:ciphertext (todo en hex)
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { s3PutObject, s3DeleteObject, type S3Config } from "./s3";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export class InvalidFileError extends Error {
  status = 400;
}

/**
 * Backend de storage escolhido por variável de ambiente:
 *   STORAGE_DRIVER=local (padrão) — salva em public/uploads, exige
 *     filesystem persistente (VPS, container de longa duração).
 *   STORAGE_DRIVER=s3 — envia para qualquer storage S3-compatível (AWS S3,
 *     Cloudflare R2, Backblaze B2, MinIO). Necessário em deploy serverless
 *     (Vercel etc.) ou com múltiplas instâncias, onde o disco local não é
 *     compartilhado nem persistente entre requisições.
 *
 * Em ambos os casos, `saveUploadedFile`/`deleteUploadedFile` mantêm a
 * mesma assinatura — o resto do app (rotas de API, admin) não precisa
 * saber qual dos dois está em uso.
 */
function getS3Config(): S3Config | null {
  const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;
  return {
    endpoint: S3_ENDPOINT,
    region: S3_REGION || "auto",
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  };
}

function isS3Driver() {
  return process.env.STORAGE_DRIVER === "s3";
}

function buildUniqueFilename(originalName: string, mimeType: string) {
  const ext = path.extname(originalName).toLowerCase() || guessExtension(mimeType);
  return `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
}

/**
 * Salva um arquivo enviado por multipart/form-data e retorna a URL pública
 * dele. Ver comentário acima sobre a escolha local vs S3.
 */
export async function saveUploadedFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new InvalidFileError(`Tipo de arquivo não permitido: ${file.type}`);
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new InvalidFileError("Arquivo excede o limite de 8MB");
  }

  const uniqueName = buildUniqueFilename(file.name, file.type);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isS3Driver()) {
    const s3Config = getS3Config();
    if (!s3Config) {
      throw new Error("STORAGE_DRIVER=s3 mas faltam variáveis S3_* no ambiente — ver .env.example");
    }
    const key = `uploads/${uniqueName}`;
    await s3PutObject(s3Config, key, buffer, file.type);

    const publicBase = process.env.S3_PUBLIC_URL_BASE || s3Config.endpoint;
    return {
      url: `${publicBase.replace(/\/$/, "")}/${s3Config.bucket}/${key}`,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, uniqueName);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueName}`,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteUploadedFile(url: string) {
  if (isS3Driver()) {
    const s3Config = getS3Config();
    if (!s3Config) return;
    // Extrai a key após "/<bucket>/" da URL pública salva no banco.
    const marker = `/${s3Config.bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const key = url.slice(idx + marker.length);
    await s3DeleteObject(s3Config, key).catch(() => {});
    return;
  }

  if (!url.startsWith("/uploads/")) return; // nunca apaga fora da pasta de uploads local
  const filePath = path.join(process.cwd(), "public", url);
  await unlink(filePath).catch(() => {});
}

function guessExtension(mimeType: string) {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };
  return map[mimeType] ?? "";
}

import { createHash, createHmac } from "crypto";

/**
 * Implementação mínima de AWS Signature V4 para requisições PUT/DELETE de
 * objeto único. Evita depender do @aws-sdk/client-s3 (pacote grande) só
 * para duas operações simples — qualquer provedor S3-compatível (AWS S3,
 * Cloudflare R2, Backblaze B2, MinIO) aceita esse esquema de assinatura.
 *
 * Não é uma implementação genérica de SigV4 (não cobre query params,
 * multipart, etc.) — é suficiente para PUT/DELETE de objeto por chave.
 */
export interface S3Config {
  endpoint: string; // ex: https://<accountid>.r2.cloudflarestorage.com
  region: string; // R2 aceita "auto"
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function sha256Hex(data: Buffer | string) {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data).digest();
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function encodeS3Path(key: string): string { 
  return key .split("/") .map((part) => encodeURIComponent(part)) .join("/"); 
}
function normalizeEndpoint(endpoint: string): string { 
  return endpoint.replace(/\/+$/, ""); 
}

function signRequest(config: S3Config, method: "PUT" | "DELETE", key: string, body: Buffer, contentType?: string) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const endpoint = new URL( normalizeEndpoint(config.endpoint), );
  const host = new URL(config.endpoint).host;
  const basePath = endpoint.pathname.replace( /\/+$/, "", );
  const encodedBucket = encodeURIComponent( config.bucket, );
  const encodedKey = encodeS3Path(key);
  const canonicalUri = `${basePath}/${encodedBucket}/${encodedKey}`;
  const payloadHash = sha256Hex(body);

  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k].trim()}\n`).join("");
  const signedHeaders = sortedHeaderKeys.join(";");
  const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = getSigningKey(config.secretAccessKey, dateStamp, config.region, "s3");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const url = `${normalizeEndpoint(config.endpoint)}` + `/${encodedBucket}` + `/${encodedKey}`;
  return {
    url,
    headers: { ...headers, Authorization: authorization },
  };
}

export async function s3PutObject(config: S3Config, key: string, body: Buffer, contentType: string) {
  const { url, headers } = signRequest(config, "PUT", key, body, contentType);
  // Buffer é, em runtime, uma subclasse de Uint8Array (BodyInit válido para
  // fetch no Node) — os tipos do DOM lib usados aqui só não sabem disso,
  // daí a conversão explícita em vez de castar com "as any".
  const res = await fetch(url, { method: "PUT", headers, body: new Uint8Array(body) });
  if (!res.ok) {
    throw new Error(`Falha ao enviar para o storage S3 (${res.status}): ${await res.text().catch(() => "")}`);
  }
}

export async function s3DeleteObject(config: S3Config, key: string) {
  const { url, headers } = signRequest(config, "DELETE", key, Buffer.alloc(0));
  const res = await fetch(url, { method: "DELETE", headers });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Falha ao excluir do storage S3 (${res.status})`);
  }
}

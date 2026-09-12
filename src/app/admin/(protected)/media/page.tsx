"use client";

import { useEffect, useRef, useState } from "react";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  uploader: { name: string };
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/media");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.media ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Falha ao enviar ${file.name}`);
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    load();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Mídia</h1>
          <p className="admin-subtitle">Imagens disponíveis para posts e páginas</p>
        </div>
        <label className="btn btn-primary" style={{ cursor: "pointer" }}>
          {uploading ? "Enviando…" : "+ Enviar arquivo"}
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {items === null ? (
        <div className="empty-state">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-title">Nenhum arquivo ainda</div>
          Envie imagens para usar como destaque de posts ou dentro do conteúdo.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ overflow: "hidden" }}>
              <div style={{ aspectRatio: "1 / 1", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{item.mimeType}</span>
                )}
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.filename}>
                  {item.filename}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-500)", marginBottom: 8 }}>{formatSize(item.size)}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      navigator.clipboard.writeText(item.url);
                    }}
                  >
                    Copiar link
                  </button>
                  <DeleteButton onConfirm={() => handleDelete(item.id)} label="×" confirmText={`Excluir "${item.filename}"?`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

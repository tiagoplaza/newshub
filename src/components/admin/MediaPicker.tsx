"use client";

import { useEffect, useRef, useState } from "react";

interface MediaItem { id: string; url: string; filename: string; mimeType: string; }

export function MediaPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/media");
    const data = await res.json();
    setItems(data.media ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      await fetch("/api/media", { method: "POST", body: formData });
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    load();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(21,26,36,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 640, maxHeight: "80vh", overflow: "auto", padding: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Escolher imagem</div>
          <label className="btn btn-sm btn-primary" style={{ cursor: "pointer" }}>
            {uploading ? "Enviando…" : "+ Enviar"}
            <input ref={fileInput} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleUpload(e.target.files)} />
          </label>
        </div>

        {items === null ? (
          <div className="field-hint">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="field-hint">Nenhuma imagem enviada ainda.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.url)}
                style={{ border: "1px solid var(--line)", borderRadius: 6, padding: 0, overflow: "hidden", cursor: "pointer", aspectRatio: "1 / 1", background: "var(--paper)" }}
                title={item.filename}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

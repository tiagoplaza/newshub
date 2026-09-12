"use client";

import { useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface Tag { id: string; name: string; slug: string; }

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/tags");
    const data = await res.json();
    setTags(data.tags ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível criar a tag.");
      return;
    }
    setName("");
    load();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Tags</h1>
          <p className="admin-subtitle">Rótulos livres para marcar posts relacionados</p>
        </div>
      </header>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          {error && <div className="error-banner" style={{ flexBasis: "100%" }}>{error}</div>}
          <div className="field" style={{ marginBottom: 0, flex: 1 }}>
            <label htmlFor="tag-name">Nova tag</label>
            <input id="tag-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Criar</button>
        </form>
      </div>

      <div className="pill-list">
        {tags === null ? (
          <div className="empty-state">Carregando…</div>
        ) : tags.length === 0 ? (
          <div className="empty-state" style={{ width: "100%" }}>Nenhuma tag ainda.</div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="pill" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {tag.name}
              <DeleteButton onConfirm={() => handleDelete(tag.id)} label="×" confirmText={`Excluir a tag "${tag.name}"?`} />
            </div>
          ))
        )}
      </div>
    </>
  );
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

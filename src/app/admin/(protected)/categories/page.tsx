"use client";

import { useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name), parentId: parentId || null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível criar a categoria.");
      return;
    }
    setName("");
    setParentId("");
    load();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Categorias</h1>
          <p className="admin-subtitle">Organize os posts em categorias e subcategorias</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        <div className="card">
          {categories === null ? (
            <div className="empty-state">Carregando…</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">Nenhuma categoria ainda</div>
              Crie a primeira ao lado.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.parentId && <span style={{ color: "var(--ink-500)" }}>— </span>}{cat.name}</td>
                    <td style={{ color: "var(--ink-500)", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{cat.slug}</td>
                    <td style={{ textAlign: "right" }}>
                      <DeleteButton onConfirm={() => handleDelete(cat.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form onSubmit={handleCreate} className="card card-pad">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Nova categoria</div>
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label htmlFor="cat-name">Nome</label>
            <input id="cat-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="cat-parent">Categoria pai</label>
            <select id="cat-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">Nenhuma</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Criar categoria
          </button>
        </form>
      </div>
    </>
  );
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

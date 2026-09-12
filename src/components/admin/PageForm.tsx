"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BlockEditor } from "./BlockEditor";

interface PageOption { id: string; title: string; }

interface PageFormValue {
  title: string;
  slug: string;
  content: string;
  status: string;
  template: string;
  parentId: string;
  metaTitle: string;
  metaDescription: string;
}

const EMPTY: PageFormValue = {
  title: "",
  slug: "",
  content: "",
  status: "DRAFT",
  template: "default",
  parentId: "",
  metaTitle: "",
  metaDescription: "",
};

export function PageForm({ pageId }: { pageId?: string }) {
  const router = useRouter();
  const [value, setValue] = useState<PageFormValue>(EMPTY);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!pageId);

  useEffect(() => {
    fetch("/api/pages").then((r) => r.json()).then((data) => setPages((data.pages ?? []).filter((p: PageOption & { id: string }) => p.id !== pageId)));
  }, [pageId]);

  useEffect(() => {
    if (!pageId) return;
    // Não há rota GET por id para páginas — reaproveita a listagem e filtra.
    fetch("/api/pages")
      .then((r) => r.json())
      .then((data) => {
        const p = (data.pages ?? []).find((x: { id: string }) => x.id === pageId);
        if (p) {
          setValue({
            title: p.title,
            slug: p.slug,
            content: p.content ?? "",
            status: p.status,
            template: p.template ?? "default",
            parentId: p.parentId ?? "",
            metaTitle: "",
            metaDescription: "",
          });
        }
        setLoaded(true);
      });
  }, [pageId]);

  function set<K extends keyof PageFormValue>(key: K, val: PageFormValue[K]) {
    setValue((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      title: value.title,
      slug: value.slug || slugify(value.title),
      content: value.content,
      status: value.status,
      template: value.template,
      parentId: value.parentId || null,
    };

    const res = await fetch(pageId ? `/api/pages/${pageId}` : "/api/pages", {
      method: pageId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível salvar a página.");
      setSaving(false);
      return;
    }

    const { page } = await res.json();

    if (value.metaTitle || value.metaDescription) {
      await fetch(`/api/seo/page/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaTitle: value.metaTitle, metaDescription: value.metaDescription }),
      });
    }

    setSaving(false);
    router.push("/admin/pages");
    router.refresh();
  }

  if (!loaded) return <div className="empty-state">Carregando…</div>;

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        <div className="card card-pad">
          <div className="field">
            <label htmlFor="title">Título</label>
            <input id="title" type="text" value={value.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="slug">Slug (URL)</label>
            <input id="slug" type="text" value={value.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(value.title)} />
          </div>
          <div className="field">
            <label htmlFor="content">Conteúdo</label>
            <BlockEditor value={value.content} onChange={(html) => set("content", html)} />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "20px 0" }} />
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>SEO</div>
          <div className="field">
            <label htmlFor="metaTitle">Meta título</label>
            <input id="metaTitle" type="text" value={value.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="metaDescription">Meta descrição</label>
            <input id="metaDescription" type="text" value={value.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
          </div>
        </div>

        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={value.status} onChange={(e) => set("status", e.target.value)}>
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="template">Template</label>
            <input id="template" type="text" value={value.template} onChange={(e) => set("template", e.target.value)} />
            <div className="field-hint">Corresponde ao slug de um tema em /themes.</div>
          </div>
          <div className="field">
            <label htmlFor="parentId">Página pai</label>
            <select id="parentId" value={value.parentId} onChange={(e) => set("parentId", e.target.value)}>
              <option value="">Nenhuma (página raiz)</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ justifyContent: "center" }}>
            {saving ? "Salvando…" : "Salvar página"}
          </button>
        </div>
      </div>
    </form>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

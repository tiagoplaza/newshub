"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BlockEditor } from "./BlockEditor";
import { MediaPicker } from "./MediaPicker";

interface Taxonomy { id: string; name: string; }

interface PostFormValue {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  categoryIds: string[];
  tagIds: string[];
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
}

const EMPTY: PostFormValue = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "DRAFT",
  categoryIds: [],
  tagIds: [],
  metaTitle: "",
  metaDescription: "",
  featuredImage: "",
};

export function PostForm({ postId }: { postId?: string }) {
  const router = useRouter();
  const [value, setValue] = useState<PostFormValue>(EMPTY);
  const [categories, setCategories] = useState<Taxonomy[]>([]);
  const [tags, setTags] = useState<Taxonomy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!postId);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/categories").then((r) => r.json()), fetch("/api/tags").then((r) => r.json())]).then(
      ([catData, tagData]) => {
        setCategories(catData.categories ?? []);
        setTags(tagData.tags ?? []);
      }
    );
  }, []);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/posts/${postId}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.post;
        setValue({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt ?? "",
          content: p.content ?? "",
          status: p.status,
          categoryIds: p.categories.map((c: { category: { id: string } }) => c.category.id),
          tagIds: p.tags.map((t: { tag: { id: string } }) => t.tag.id),
          metaTitle: p.seo?.metaTitle ?? "",
          metaDescription: p.seo?.metaDescription ?? "",
          featuredImage: p.featuredImage ?? "",
        });
        setLoaded(true);
      });
  }, [postId]);

  function set<K extends keyof PostFormValue>(key: K, val: PostFormValue[K]) {
    setValue((v) => ({ ...v, [key]: val }));
  }

  function toggleMulti(key: "categoryIds" | "tagIds", id: string) {
    setValue((v) => ({
      ...v,
      [key]: v[key].includes(id) ? v[key].filter((x) => x !== id) : [...v[key], id],
    }));
  }

  async function handleSubmit(e: React.FormEvent, statusOverride?: string) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      title: value.title,
      slug: value.slug || slugify(value.title),
      excerpt: value.excerpt,
      content: value.content,
      status: statusOverride ?? value.status,
      categoryIds: value.categoryIds,
      tagIds: value.tagIds,
      featuredImage: value.featuredImage || undefined,
    };

    const res = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
      method: postId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível salvar o post.");
      setSaving(false);
      return;
    }

    const { post } = await res.json();

    if (value.metaTitle || value.metaDescription) {
      await fetch(`/api/seo/post/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaTitle: value.metaTitle, metaDescription: value.metaDescription }),
      });
    }

    setSaving(false);
    router.push("/admin/posts");
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
            <input id="slug" type="text" value={value.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(value.title) || "gerado-automaticamente"} />
          </div>
          <div className="field">
            <label htmlFor="excerpt">Resumo</label>
            <input id="excerpt" type="text" value={value.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card card-pad">
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Publicação</div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" value={value.status} onChange={(e) => set("status", e.target.value)}>
                <option value="DRAFT">Rascunho</option>
                <option value="PENDING_REVIEW">Em revisão</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="SCHEDULED">Agendado</option>
                <option value="ARCHIVED">Arquivado</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn" disabled={saving} style={{ flex: 1, justifyContent: "center" }}>
                {saving ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                style={{ flex: 1, justifyContent: "center" }}
                onClick={(e) => handleSubmit(e, "PUBLISHED")}
              >
                Publicar
              </button>
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Imagem destacada</div>
            {value.featuredImage ? (
              <div style={{ marginBottom: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value.featuredImage} alt="" style={{ width: "100%", borderRadius: 6, aspectRatio: "16 / 9", objectFit: "cover" }} />
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-sm" style={{ flex: 1 }} onClick={() => setPickerOpen(true)}>
                {value.featuredImage ? "Trocar" : "Escolher imagem"}
              </button>
              {value.featuredImage && (
                <button type="button" className="btn btn-sm btn-danger" onClick={() => set("featuredImage", "")}>Remover</button>
              )}
            </div>
            {pickerOpen && (
              <MediaPicker
                onSelect={(url) => { set("featuredImage", url); setPickerOpen(false); }}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </div>

          <div className="card card-pad">
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Categorias</div>
            <div className="pill-list">
              {categories.map((c) => (
                <label key={c.id} className="pill" style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", background: value.categoryIds.includes(c.id) ? "var(--moss-100)" : undefined }}>
                  <input type="checkbox" checked={value.categoryIds.includes(c.id)} onChange={() => toggleMulti("categoryIds", c.id)} />
                  {c.name}
                </label>
              ))}
              {categories.length === 0 && <span className="field-hint">Nenhuma categoria criada ainda.</span>}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Tags</div>
            <div className="pill-list">
              {tags.map((t) => (
                <label key={t.id} className="pill" style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", background: value.tagIds.includes(t.id) ? "var(--moss-100)" : undefined }}>
                  <input type="checkbox" checked={value.tagIds.includes(t.id)} onChange={() => toggleMulti("tagIds", t.id)} />
                  {t.name}
                </label>
              ))}
              {tags.length === 0 && <span className="field-hint">Nenhuma tag criada ainda.</span>}
            </div>
          </div>
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

"use client";

import { useEffect, useState } from "react";

interface Theme { slug: string; name: string; description: string; active: boolean; }

export default function TemplatesPage() {
  const [themes, setThemes] = useState<Theme[] | null>(null);

  async function load() {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setThemes(data.templates ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function activate(slug: string) {
    await fetch(`/api/templates/${slug}/activate`, { method: "POST" });
    load();
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Temas</h1>
          <p className="admin-subtitle">Apenas um tema fica ativo por vez</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {themes === null ? (
          <div className="empty-state">Carregando…</div>
        ) : (
          themes.map((t) => (
            <div key={t.slug} className="card card-pad">
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14 }}>{t.description}</div>
              {t.active ? (
                <span className="stamp stamp-published">Ativo</span>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => activate(t.slug)}>Ativar</button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

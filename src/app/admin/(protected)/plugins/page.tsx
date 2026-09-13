"use client";

import { useEffect, useState } from "react";

interface Plugin { 
  slug: string; 
  name: string; 
  description: string; 
  active: boolean; 
  version: string; 
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/plugins");
    const data = await res.json();
    setPlugins(data.plugins ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(slug: string, active: boolean) {
    setNote(null);
    const res = await fetch(`/api/plugins/${slug}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const data = await res.json();
    if (data.note) setNote(data.note);
    load();
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Plugins</h1>
          <p className="admin-subtitle">Pacotes de código já revisados no repositório — ative para registrar seus hooks</p>
        </div>
      </header>

      {note && <div className="error-banner" style={{ background: "var(--blue-100)", color: "var(--blue-600)", borderColor: "#c4d2e6" }}>{note}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {plugins === null ? (
          <div className="empty-state">Carregando…</div>
        ) : (
          plugins.map((p) => (
            <div key={p.slug} className="card card-pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name} <span style={{ fontWeight: 400, color: "var(--ink-500)", fontSize: 12 }}>v{p.version}</span></div>
                <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{p.description}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {
                p.active && 
                ["importer", "feed-importer", "ranked-feed-importer", "seo-analytics", "ezoic-ads", "adcash", "social-share"].includes(p.slug) &&
                <a className="btn" href={`/admin/plugins/${p.slug}`}>Configurar</a>}
                <button className={`btn ${p.active ? "btn-danger" : "btn-primary"}`} onClick={() => toggle(p.slug, p.active)}>
                  {p.active ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

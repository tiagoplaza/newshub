"use client";

import { useEffect, useState } from "react";

interface Settings {
  siteName: string;
  siteDescription: string;
  defaultOgImage: string;
  robotsTxt: string;
  sitemapEnabled: boolean;
  googleVerification: string;
  bingVerification: string;
}

const EMPTY: Settings = {
  siteName: "",
  siteDescription: "",
  defaultOgImage: "",
  robotsTxt: "",
  sitemapEnabled: true,
  googleVerification: "",
  bingVerification: "",
};

export default function SeoSettingsPage() {
  const [value, setValue] = useState<Settings>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/seo")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setValue({
            siteName: data.settings.siteName ?? "",
            siteDescription: data.settings.siteDescription ?? "",
            defaultOgImage: data.settings.defaultOgImage ?? "",
            robotsTxt: data.settings.robotsTxt ?? "",
            sitemapEnabled: data.settings.sitemapEnabled ?? true,
            googleVerification: data.settings.googleVerification ?? "",
            bingVerification: data.settings.bingVerification ?? "",
          });
        }
        setLoaded(true);
      });
  }, []);

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setValue((v) => ({ ...v, [key]: val }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/settings/seo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível salvar.");
      return;
    }
    setSaved(true);
  }

  if (!loaded) return <div className="empty-state">Carregando…</div>;

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">SEO do site</h1>
          <p className="admin-subtitle">Configurações que afetam sitemap.xml, robots.txt e metadados padrão</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="card card-pad" style={{ maxWidth: 560 }}>
        {error && <div className="error-banner">{error}</div>}
        {saved && <div className="error-banner" style={{ background: "var(--moss-100)", color: "var(--moss-700)", borderColor: "#c9dbc9" }}>Configurações salvas.</div>}

        <div className="field">
          <label htmlFor="siteName">Nome do site</label>
          <input id="siteName" type="text" value={value.siteName} onChange={(e) => set("siteName", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="siteDescription">Descrição do site</label>
          <input id="siteDescription" type="text" value={value.siteDescription} onChange={(e) => set("siteDescription", e.target.value)} />
          <div className="field-hint">Usada como descrição padrão quando um post/página não define a própria.</div>
        </div>
        <div className="field">
          <label htmlFor="defaultOgImage">Imagem padrão (Open Graph)</label>
          <input id="defaultOgImage" type="text" value={value.defaultOgImage} onChange={(e) => set("defaultOgImage", e.target.value)} placeholder="/uploads/og-padrao.jpg" />
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "20px 0" }} />

        <div className="field field-check">
          <input id="sitemapEnabled" type="checkbox" checked={value.sitemapEnabled} onChange={(e) => set("sitemapEnabled", e.target.checked)} />
          <label htmlFor="sitemapEnabled">Expor sitemap.xml em robots.txt</label>
        </div>
        <div className="field">
          <label htmlFor="googleVerification">Verificação Google Search Console</label>
          <input id="googleVerification" type="text" value={value.googleVerification} onChange={(e) => set("googleVerification", e.target.value)} placeholder="código de verificação" />
        </div>
        <div className="field">
          <label htmlFor="bingVerification">Verificação Bing Webmaster</label>
          <input id="bingVerification" type="text" value={value.bingVerification} onChange={(e) => set("bingVerification", e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
      </form>
    </>
  );
}

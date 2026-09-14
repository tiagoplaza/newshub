"use client";

import { useEffect, useState } from "react";

interface Settings {
  active: boolean;
  gtmId?: string;
  gaId?: string;
  adsenseClientId?: string;
  enableSeoDefaults?: boolean;
}

export default function SeoAnalyticsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/plugins/seo-analytics");
    const data = await res.json();
    if (res.ok) setSettings(data);
    else setNotice(data.error ?? "Não foi possível carregar a configuração");
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!settings) return;
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/plugins/seo-analytics", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gtmId: settings.gtmId ?? "",
        gaId: settings.gaId ?? "",
        adsenseClientId: settings.adsenseClientId ?? "",
        enableSeoDefaults: settings.enableSeoDefaults ?? true,
      }),
    });
    const data = await res.json();
    setBusy(false);
    setNotice(res.ok ? "Configurações salvas." : data.error ?? "Não foi possível salvar");
    if (res.ok) load();
  }

  if (!settings) return <div className="empty-state">Carregando…</div>;

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">SEO & Analytics</h1>
          <p className="admin-subtitle">Google Tag Manager, Google Analytics, AdSense e padrões de SEO.</p>
        </div>
      </header>

      {notice && (
        <div className="error-banner" style={{ background: "var(--blue-100)", color: "var(--blue-600)", borderColor: "#c4d2e6" }}>
          {notice}
        </div>
      )}

      {!settings.active && (
        <div className="error-banner">Ative o plugin na listagem para que os scripts sejam carregados no site.</div>
      )}

      <section className="card card-pad" style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="form-label">Google Tag Manager ID</label>
          <input
            className="form-input"
            placeholder="GTM-XXXXXXX"
            value={settings.gtmId ?? ""}
            onChange={(e) => setSettings({ ...settings, gtmId: e.target.value })}
          />
        </div>

        <div>
          <label className="form-label">Google Analytics ID (GA4)</label>
          <input
            className="form-input"
            placeholder="G-XXXXXXXXXX"
            value={settings.gaId ?? ""}
            onChange={(e) => setSettings({ ...settings, gaId: e.target.value })}
          />
        </div>

        <div>
          <label className="form-label">Google AdSense — Client ID</label>
          <input
            className="form-input"
            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
            value={settings.adsenseClientId ?? ""}
            onChange={(e) => setSettings({ ...settings, adsenseClientId: e.target.value })}
          />
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
          <input
            type="checkbox"
            checked={settings.enableSeoDefaults ?? true}
            onChange={(e) => setSettings({ ...settings, enableSeoDefaults: e.target.checked })}
          />
          Preencher meta descrição e imagem OG ausentes com os padrões globais do site
        </label>

        <div>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </section>
    </>
  );
}
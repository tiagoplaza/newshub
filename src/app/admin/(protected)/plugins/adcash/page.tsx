"use client";

import { useEffect, useState } from "react";
import AutoTagSection from "./components/AutoTagSection";
import BannersSection from "./components/BannersSection";
import type { Banner, Settings } from "./types";
import {
    addBanner,
    loadAdCashSettings,
    removeBanner,
    saveAdCashSettings,
    updateBanner,
    updateSetting,
} from "./functions/adcah";

export default function AdCashPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function load() {
        const result = await loadAdCashSettings();
        if (result.settings) {
            setSettings(result.settings);
        } else {
            setNotice(result.error ?? "Não foi possível carregar a configuração");
        }
    }

    useEffect(() => {
        load();
    }, []);

    function handleSettingChange<K extends keyof Settings> (key: K, value: Settings[K]) {
        if (!settings) return;
        setSettings(updateSetting(settings, key, value));
    }

    function handleBannerChange(
        bannerId: string,
        field: keyof Banner,
        value: string | boolean,
    ) {
        if (!settings) return;
        setSettings(
            updateBanner(
                settings,
                bannerId,
                field,
                value,
            )
        );
    }

    function handleAddBanner() {
        if (!settings) return;
        setSettings(addBanner(settings));
    }

    function handleRemoveBanner(bannerId: string) {
        if (!settings) return;
        setSettings(removeBanner(settings, bannerId));
    }

    async function handleSave() {
        if (!settings) return;
        setBusy(true);
        setNotice(null);

        const error = await saveAdCashSettings(settings);

        if (error) {
            setNotice(error);
        } else {
            setNotice("Configurações salvas.");
            await load();
        }
        setBusy(false);
    }

    if (!settings) {
        return (<div className="empty-state">Carregando… </div>);
    }

    return (
        <>
            <header className="admin-header">
                <div>
                    <h1 className="admin-title">AdCash</h1>
                    <p className="admin-subtitle">
                        Configure o AutoTag e os banners AdCash.
                    </p>
                </div>
            </header>

            {notice && (
                <div className="error-banner">
                    {notice}
                </div>
            )}

            {!settings.active && (
                <div className="error-banner">
                    Ative o plugin na listagem para carregar os anúncios no site.
                </div>
            )}

            <AutoTagSection
                settings={settings}
                onChange={handleSettingChange}
            />

            <BannersSection
                settings={settings}
                busy={busy}
                onAdd={handleAddBanner}
                onChange={handleBannerChange}
                onRemove={handleRemoveBanner}
                onSave={handleSave}
            />
        </>
    );
}

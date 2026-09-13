"use client";

import type { Banner, Settings } from "../types";
import BannerCard from "./BannerCard";

interface BannersSectionProps {
    settings: Settings;
    busy: boolean;
    onAdd: () => void;
    onChange: (bannerId: string, field: keyof Banner, value: string | boolean) => void;
    onRemove: (bannerId: string) => void;
    onSave: () => void;
}

export default function BannersSection({
    settings,
    busy,
    onAdd,
    onChange,
    onRemove,
    onSave,
}: BannersSectionProps) {
    return (
        <section
            className="card card-pad"
            style={{
                maxWidth: 720,
                display: "flex",
                flexDirection: "column",
                gap: 20,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                <div>
                    <h2 style={{ marginBottom: 6 }}>Banners </h2>
                    <p
                        style={{
                        margin: 0,
                        fontSize: 14,
                        opacity: 0.7,
                        }}
                    >
                        Cadastre múltiplos banners e defina individualmente onde cada um será renderizado.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onAdd}
                >
                + Adicionar banner
                </button>
            </div>

            {settings.banners.length === 0 && (
                <div
                    style={{
                            padding: "32px 20px",
                            textAlign: "center",
                            border: "1px dashed currentColor",
                            opacity: 0.6,
                    }}
                >
                    Nenhum banner cadastrado.
                </div>
            )}
            {settings.banners.map((banner, index) => (
                <BannerCard
                    key={banner.id}
                    banner={banner}
                    index={index}
                    onChange={onChange}
                    onRemove={onRemove}
                />
            ))}
            <div
                style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingTop: 4,
                }}
            >
                <button
                type="button"
                className="btn btn-primary"
                onClick={onSave}
                disabled={busy}
                >
                    {busy ? "Salvando…" : "Salvar configurações"}
                </button>
            </div>
        </section>
    );
}

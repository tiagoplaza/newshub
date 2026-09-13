"use client";

import type { Banner } from "../types";

interface BannerCardProps {
    banner: Banner;
    index: number;
    onChange: (bannerId: string, field: keyof Banner, value: string | boolean) => void;
    onRemove: (bannerId: string) => void;
}

export default function BannerCard({
    banner,
    index,
    onChange,
    onRemove,
}: BannerCardProps) {
    return (
        <div
            style={{
                border: "1px solid var(--border-color, #ddd)",
                borderRadius: 8,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <strong>Banner {index + 1} </strong>
                <button
                type="button"
                className="btn"
                onClick={() => onRemove(banner.id)}
                style={{color: "var(--danger-color, #c00)"}}
                >
                    Excluir
                </button>
            </div>

            <div>
                <label className="form-label">Nome</label>
                <input
                    className="form-input"
                    value={banner.name}
                    onChange={(event) => onChange(banner.id, "name", event.target.value)}
                    placeholder="Ex.: Banner Home Topo"
                />
            </div>

            <div>
                <label className="form-label">Zone ID</label>
                <input
                    className="form-input"
                    value={banner.zoneId}
                    onChange={(event) => onChange(banner.id, "zoneId", event.target.value)}
                    placeholder="Ex.: 123456"
                />
            </div>

            <div>
                <label className="form-label">Render In</label>
                <input
                    className="form-input"
                    value={banner.renderIn}
                    onChange={(event) => onChange(banner.id, "renderIn", event.target.value)}
                    placeholder="Ex.: #adcash-home-top"
                />

                <small
                    style={{
                        display: "block",
                        marginTop: 6,
                        opacity: 0.65,
                    }}
                >
                    Seletor CSS do elemento onde o banner será renderizado.
                </small>
            </div>

            <label
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 14,
                }}
            >
                <input
                    type="checkbox"
                    checked={banner.enabled}
                    onChange={(event) => onChange(banner.id, "enabled", event.target.checked)}
                />
                Ativar este banner
            </label>
        </div>
    );
}

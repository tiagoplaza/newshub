"use client";

import type { Settings } from "../types";

interface AutoTagSectionProps {
    settings: Settings;
    onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export default function AutoTagSection({settings, onChange}: AutoTagSectionProps) {
    return (
        <section
            className="card card-pad"
            style={{
                maxWidth: 720,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                marginBottom: 24,
            }}
        >
            <div>
                <h2 style={{ marginBottom: 6 }}>AutoTag </h2>
                <p style={{
                    margin: 0,
                    fontSize: 14,
                    opacity: 0.7,
                }}
                >
                Configure a zona utilizada pelo AutoTag do AdCash.
                </p>
            </div>

            <div>
                <label className="form-label">AutoTag Zone ID</label>
                <input
                className="form-input"
                value={settings.autoTagZoneId}
                onChange={(event) => onChange("autoTagZoneId", event.target.value)}
                placeholder="Ex.: 123456"
                />
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
                checked={settings.enableAutoTag}
                onChange={(event) => onChange("enableAutoTag", event.target.checked)}
                />
                Ativar AutoTag
            </label>
        </section>
    );
}

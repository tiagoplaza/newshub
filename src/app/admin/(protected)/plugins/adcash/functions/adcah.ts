import type { Banner, Settings } from "../types";

export async function loadAdCashSettings(): Promise<{settings?: Settings; error?: string;}> {
    try {
        const response = await fetch("/api/plugins/adcash");
        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.error ?? "Não foi possível carregar a configuração",
            };
        }
        return {
            settings: {
                ...data,
                banners: data.banners ?? [],
            },
        };

    } catch {
        return {
            error: "Não foi possível carregar a configuração",
        };
    }
}

export async function saveAdCashSettings( settings: Settings ): Promise<string | null> {
    try {
        const response = await fetch("/api/plugins/adcash", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(settings)
        });
        const data = await response.json();
        if (!response.ok) {
            return data.error ?? "Não foi possível salvar";
        }
        return null;
    } catch {
        return "Não foi possível salvar";
    }
}

export function createBanner( bannersCount: number ): Banner {
    return {
        id: crypto.randomUUID(),
        name: `Banner ${bannersCount + 1}`,
        zoneId: "",
        renderIn: "",
        enabled: true,
    };
}

export function updateSetting<K extends keyof Settings>(
    settings: Settings,
    key: K,
    value: Settings[K],
): Settings {
    return {
        ...settings,
        [key]: value,
    };
}

export function updateBanner(
    settings: Settings,
    bannerId: string,
    field: keyof Banner,
    value: string | boolean,
): Settings {
    return {
        ...settings,
        banners: settings.banners.map((banner) => banner.id === bannerId
            ? {
                ...banner,
                [field]: value,
            }
            : banner,
        ),
    };
}

export function addBanner(settings: Settings ): Settings {
    const banner = createBanner(settings.banners.length);
    return {
        ...settings,
        banners: [...settings.banners, banner],
    };
}

export function removeBanner(settings: Settings, bannerId: string ): Settings {
    return {
        ...settings,
        banners: settings.banners.filter((banner) => banner.id !== bannerId),
    };
}

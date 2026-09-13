import type { PluginModule } from "../../src/lib/plugins/registry";

import { prisma } from "../../src/lib/prisma";
export const ADCASH_SLUG = "adcash";
export const DEFAULT_ADCASH_AUTO_TAG_ZONE_ID = "uoimnmi5u";
export const DEFAULT_ADCASH_BANNER_ZONE_ID = "12103786";

export interface AdCashBanner {
  id: string;
  name: string;
  zoneId: string;
  renderIn: string;
  enabled: boolean;
}

export interface AdCashSettings {
  autoTagZoneId?: string;
  enableAutoTag?: boolean;
  banners?: AdCashBanner[];
}

export async function getAdCashSettings(): Promise<{
  active: boolean;
  settings: AdCashSettings;
}> {
  const plugin = await prisma.plugin.findUnique({
    where: { slug: ADCASH_SLUG },
  });

  const storedSettings = plugin?.settings &&
    typeof plugin.settings === "object"
      ? (plugin.settings as unknown as AdCashSettings)
      : {};

  return {
    active: plugin?.active ?? false,
    settings: {
      autoTagZoneId:
        storedSettings.autoTagZoneId ??
        DEFAULT_ADCASH_AUTO_TAG_ZONE_ID,
      enableAutoTag: storedSettings.enableAutoTag ?? true,
      banners: storedSettings.banners ?? [],
    },
  };
}

const plugin: PluginModule = {
  slug: ADCASH_SLUG,
  name: "AdCash",
  version: "1.0.0",
  description: "Integração com a plataforma AdCash para anúncios auto tag e banner.",
  register() {
    // A integração é carregada pelos componentes de scripts do site.
  },
};

export default plugin;

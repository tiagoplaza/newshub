import type { PluginModule } from "../../src/lib/plugins/registry";
import { CoreHooks } from "../../src/lib/plugins/hooks";
import { prisma } from "../../src/lib/prisma";

export const SEO_ANALYTICS_SLUG = "seo-analytics";

export interface SeoAnalyticsSettings {
  gtmId?: string;
  gaId?: string;
  adsenseClientId?: string;
  enableSeoDefaults?: boolean;
}

interface SeoMetaLike {
  metaDescription: string | null;
  ogImage: string | null;
  [key: string]: unknown;
}

export async function getSeoAnalyticsSettings(): Promise<{ active: boolean; settings: SeoAnalyticsSettings }> {
  const plugin = await prisma.plugin.findUnique({ where: { slug: SEO_ANALYTICS_SLUG } });
  const settings =
    plugin?.settings && typeof plugin.settings === "object"
      ? (plugin.settings as unknown as SeoAnalyticsSettings)
      : {};
  return { active: plugin?.active ?? false, settings };
}

const plugin: PluginModule = {
  slug: SEO_ANALYTICS_SLUG,
  name: "SEO & Analytics",
  version: "1.0.0",
  description:
    "Integração com Google Tag Manager, Google Analytics e AdSense, além de preencher metadados de SEO ausentes com os padrões globais do site.",
  register({ hooks }) {
    // Mesma lógica do antigo seo-defaults, agora com toggle nas configurações.
    hooks.addFilter<SeoMetaLike>(CoreHooks.SEO_META_OUTPUT, async (seo) => {
      const { settings } = await getSeoAnalyticsSettings();
      if (settings.enableSeoDefaults === false) return seo;
      if (seo.metaDescription && seo.ogImage) return seo;

      const globalSettings = await prisma.seoSettings.findUnique({ where: { id: "global" } });
      if (!globalSettings) return seo;

      return {
        ...seo,
        metaDescription: seo.metaDescription || globalSettings.siteDescription || null,
        ogImage: seo.ogImage || globalSettings.defaultOgImage || null,
      };
    });
  },
};

export default plugin;
import type { PluginModule } from "../../src/lib/plugins/registry";
import { prisma } from "../../src/lib/prisma";

export const SOCIAL_SHARE_SLUG = "social-share";

export type SocialShareIcon =
  | "facebook"
  | "x"
  | "linkedin"
  | "whatsapp"
  | "telegram"
  | "mail"
  | "copy";

export interface SocialNetworkConfig {
  id: string;
  name: string;
  icon: SocialShareIcon;
  active: boolean;
}

export interface SocialShareSettings {
  networks: SocialNetworkConfig[];
}

export async function getSocialShareSettings(): Promise<{ active: boolean; settings: SocialShareSettings }> {
  const plugin = await prisma.plugin.findUnique({ where: { slug: SOCIAL_SHARE_SLUG } });
  const settings =
    plugin?.settings && typeof plugin.settings === "object"
      ? (plugin.settings as unknown as SocialShareSettings)
      : { networks: [] };

  const normalized = {
    networks: Array.isArray(settings.networks) ? settings.networks : [],
  } satisfies SocialShareSettings;

  return { active: plugin?.active ?? false, settings: normalized };
}

const plugin: PluginModule = {
  slug: SOCIAL_SHARE_SLUG,
  name: "Social Share",
  version: "1.0.0",
  description: "Cadastre redes sociais e exiba botões de compartilhamento em artigos e páginas.",
  register() {
    // O plugin expõe um componente reutilizável e não precisa de hooks globais.
  },
};

export { default as SocialShare } from "./components/SocialShare";
export default plugin;

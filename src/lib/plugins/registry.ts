import { prisma } from "../prisma";
import { hooks } from "./hooks";

/**
 * Contrato que cada plugin em /plugins/<slug>/index.ts deve exportar.
 */
export interface PluginModule {
  slug: string;
  name: string;
  version: string;
  description: string;
  /** Chamado uma vez, no bootstrap, se o plugin estiver ativo no banco. */
  register: (api: { hooks: typeof hooks; settings: Record<string, unknown> }) => void | Promise<void>;
}

// Cada plugin novo precisa ser importado aqui explicitamente. Isso é
// intencional: em vez de escanear o filesystem e importar dinamicamente
// (o que reintroduziria o mesmo risco de "código desconhecido rodando em
// produção" que o WordPress tem), o próprio time revisa e registra o
// import antes de habilitar o plugin no admin. Essa é agora a ÚNICA lista
// que precisa ser editada para adicionar um plugin novo — a tela
// /admin/plugins e a rota GET /api/plugins leem os metadados (nome, versão,
// descrição) direto do módulo de cada plugin em vez de duplicá-los aqui.
const AVAILABLE_PLUGINS: Record<string, () => Promise<{ default: PluginModule }>> = {
  "adcash": () => import("../../../plugins/adcash"),
  "seo-analytics": () => import("../../../plugins/seo-analytics"),
  "social-share": () => import("../../../plugins/social-share"),
};

export interface PluginListEntry {
  slug: string;
  name: string;
  version: string;
  description: string;
  active: boolean;
}

/**
 * Lista todos os plugins conhecidos (os registrados em AVAILABLE_PLUGINS
 * acima) já cruzados com o estado `active` salvo no banco — é o que
 * alimenta a tela /admin/plugins e a rota GET /api/plugins. Antes disso
 * existia uma segunda lista (`CATALOG`) na rota de API que precisava ser
 * mantida manualmente em sincronia com esta; agora os metadados vêm sempre
 * do próprio módulo do plugin, então só existe um lugar para editar ao
 * adicionar um plugin novo.
 */
export async function listAvailablePlugins(): Promise<PluginListEntry[]> {
  const installed = await prisma.plugin.findMany();
  const activeBySlug = new Map<string, boolean>(
    installed.map((p: { slug: string; active: boolean }): [string, boolean] => [p.slug, p.active])
  );

  return Promise.all(
    Object.entries(AVAILABLE_PLUGINS).map(async ([slug, loader]) => {
      const mod = await loader();
      return {
        slug: mod.default.slug,
        name: mod.default.name,
        version: mod.default.version,
        description: mod.default.description,
        active: activeBySlug.get(slug) ?? false,
      };
    })
  );
}

let bootstrapped = false;

/**
 * Carrega e registra todos os plugins marcados como `active` no banco.
 * Deve ser chamado uma vez no startup do servidor (ex: em um arquivo
 * instrumentation.ts do Next.js).
 */
export async function bootstrapPlugins() {
  if (bootstrapped) return;
  bootstrapped = true;

  const activePlugins = await prisma.plugin.findMany({ where: { active: true } });

  for (const record of activePlugins) {
    const loader = AVAILABLE_PLUGINS[record.slug];
    if (!loader) {
      console.warn(`Plugin "${record.slug}" está ativo no banco mas não tem código registrado em AVAILABLE_PLUGINS.`);
      continue;
    }
    const mod = await loader();
    const settings = record.settings && typeof record.settings === "object" ? record.settings as Record<string, unknown> : {};
    await mod.default.register({ hooks, settings });
  }
}

/** Ativa um plugin: grava no banco e re-registra os hooks dele. */
export async function activatePlugin(slug: string) {
  const loader = AVAILABLE_PLUGINS[slug];
  if (!loader) throw new Error(`Plugin desconhecido: ${slug}`);

  const mod = await loader();
  await prisma.plugin.upsert({
    where: { slug },
    create: { slug, name: mod.default.name, version: mod.default.version, active: true },
    update: { active: true },
  });
  await mod.default.register({ hooks, settings: {} });
}

export async function deactivatePlugin(slug: string) {
  await prisma.plugin.update({ where: { slug }, data: { active: false } });
  // Observação: hooks já registrados em memória continuam ativos até o
  // próximo restart do processo, já que HookRegistry não rastreia por
  // plugin de origem. Para desativação "a quente" sem restart, seria
  // necessário estender addAction/addFilter para guardar o slug do dono e
  // permitir remoção seletiva.
}

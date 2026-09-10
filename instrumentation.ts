/**
 * Ponto de entrada padrão do Next.js para código que deve rodar uma vez, no
 * boot do servidor (App Router, desde o Next 13+, habilitado via
 * next.config com experimental.instrumentationHook em versões antigas —
 * na 15+ já vem habilitado por padrão).
 *
 * Sem isso, `Plugin.active = true` no banco nunca virava, de fato, hooks
 * registrados em memória — a UI de /admin/plugins ligava a flag, mas
 * nenhum plugin rodava de verdade até a primeira chamada manual.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapPlugins } = await import("./src/lib/plugins/registry");
    await bootstrapPlugins();
  }
}

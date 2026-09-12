/**
 * Sistema de hooks inspirado no WordPress (actions + filters), adaptado para
 * um app Next.js/TypeScript.
 *
 * Diferença importante em relação ao WordPress: lá, um plugin é um arquivo
 * PHP solto que pode ser enviado por upload e passa a rodar imediatamente no
 * servidor. Isso é conveniente mas é também a maior superfície de ataque do
 * WordPress (upload de plugin malicioso = RCE). Aqui optamos por um modelo
 * mais seguro e idiomático para Node/Next:
 *
 *   - Um "plugin" é um pacote de código que já está no repositório
 *     (pasta /plugins/<slug>), versionado e revisado como qualquer outro
 *     código — não é enviado dinamicamente via upload em produção.
 *   - Instalar/ativar um plugin (via admin) apenas liga/desliga o registro
 *     dele no banco (model Plugin) e, em runtime, registra os hooks que ele
 *     expõe. Não há eval() nem upload-and-run de código arbitrário.
 *   - Se no futuro for necessário permitir upload de plugins em produção,
 *     isso exige sandboxing sério (isolate de processo, permissões de
 *     arquivo, revisão) — fora do escopo deste núcleo.
 *
 * Cada plugin exporta um objeto `PluginModule` que registra suas actions e
 * filters durante a fase de bootstrap (ver registry.ts).
 */

type ActionHandler<T = unknown> = (payload: T) => void | Promise<void>;
type FilterHandler<T = unknown> = (value: T, context?: unknown) => T | Promise<T>;

class HookRegistry {
  private actions = new Map<string, ActionHandler[]>();
  private filters = new Map<string, FilterHandler[]>();

  /** Registra um listener para um evento (ex: "post.published"). */
  addAction<T = unknown>(hookName: string, handler: ActionHandler<T>) {
    const list = this.actions.get(hookName) ?? [];
    list.push(handler as ActionHandler);
    this.actions.set(hookName, list);
  }

  /** Dispara um evento para todos os listeners registrados, em sequência. */
  async doAction<T = unknown>(hookName: string, payload: T) {
    const list = this.actions.get(hookName) ?? [];
    for (const handler of list) {
      await handler(payload);
    }
  }

  /** Registra um transformador para um valor filtrável (ex: "post.content.render"). */
  addFilter<T = unknown>(hookName: string, handler: FilterHandler<T>) {
    const list = this.filters.get(hookName) ?? [];
    list.push(handler as FilterHandler);
    this.filters.set(hookName, list);
  }

  /** Aplica todos os filtros registrados, em cadeia, e retorna o valor final. */
  async applyFilters<T = unknown>(hookName: string, value: T, context?: unknown): Promise<T> {
    const list = this.filters.get(hookName) ?? [];
    let result: T = value;
    for (const handler of list) {
      // handler é armazenado como FilterHandler<unknown> (erasure ao registrar
      // em addFilter) — o cast aqui é seguro porque quem chama applyFilters<T>
      // garante que os handlers registrados nesse hookName operam sobre T.
      result = (await handler(result, context)) as T;
    }
    return result;
  }

  /** Remove todos os handlers — usado em testes ou ao recarregar plugins. */
  reset() {
    this.actions.clear();
    this.filters.clear();
  }
}

export const hooks = new HookRegistry();

// ----------------------------------------------------------------------------
// Pontos de extensão padrão do CMS. Plugins podem se pendurar em qualquer um
// destes nomes. Esta lista serve de "contrato" documentado.
// ----------------------------------------------------------------------------
export const CoreHooks = {
  // Actions (eventos, sem retorno)
  POST_CREATED: "post.created",
  POST_PUBLISHED: "post.published",
  POST_DELETED: "post.deleted",
  PAGE_PUBLISHED: "page.published",
  USER_REGISTERED: "user.registered",
  COMMENT_SUBMITTED: "comment.submitted",

  // Filters (transformam um valor e retornam)
  POST_CONTENT_RENDER: "post.content.render", // ex: plugin de shortcodes
  POST_LIST_QUERY: "post.list.query", // ex: plugin altera a query de listagem
  SEO_META_OUTPUT: "seo.meta.output", // ex: plugin injeta og:tags extras
  ADMIN_MENU_ITEMS: "admin.menu.items", // plugin adiciona item no menu do admin
} as const;

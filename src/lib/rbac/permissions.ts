import type { CurrentUser } from "../auth/session";

/**
 * Catálogo central de permissões do sistema. Usado no seed (para popular a
 * tabela Permission) e como fonte de tipos no código — evita strings soltas
 * espalhadas pelas rotas.
 */
export const PERMISSIONS = {
  POSTS_CREATE: "posts.create",
  POSTS_EDIT_OWN: "posts.edit.own",
  POSTS_EDIT_ANY: "posts.edit.any",
  POSTS_DELETE_OWN: "posts.delete.own",
  POSTS_DELETE_ANY: "posts.delete.any",
  POSTS_PUBLISH: "posts.publish",

  PAGES_MANAGE: "pages.manage",
  CATEGORIES_MANAGE: "categories.manage",
  TAGS_MANAGE: "tags.manage",
  MENUS_MANAGE: "menus.manage",
  MEDIA_UPLOAD: "media.upload",
  COMMENTS_MODERATE: "comments.moderate",

  SEO_MANAGE: "seo.manage",

  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",

  PLUGINS_MANAGE: "plugins.manage",
  TEMPLATES_MANAGE: "templates.manage",

  SETTINGS_MANAGE: "settings.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Papéis padrão e as permissões que cada um recebe no seed. SUPER_ADMIN
 * sempre passa em qualquer checagem (ver hasPermission), independente
 * desta lista.
 */
export const DEFAULT_ROLES: Record<string, PermissionKey[]> = {
  ADMIN: Object.values(PERMISSIONS),
  EDITOR: [
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.POSTS_EDIT_ANY,
    PERMISSIONS.POSTS_DELETE_ANY,
    PERMISSIONS.POSTS_PUBLISH,
    PERMISSIONS.PAGES_MANAGE,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.TAGS_MANAGE,
    PERMISSIONS.MENUS_MANAGE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.COMMENTS_MODERATE,
    PERMISSIONS.SEO_MANAGE,
  ],
  AUTHOR: [
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.POSTS_EDIT_OWN,
    PERMISSIONS.POSTS_DELETE_OWN,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.SEO_MANAGE,
  ],
  CONTRIBUTOR: [PERMISSIONS.POSTS_CREATE, PERMISSIONS.POSTS_EDIT_OWN],
  SUBSCRIBER: [],
};

export function hasPermission(user: CurrentUser | null, permission: PermissionKey): boolean {
  if (!user) return false;
  if (user.role.slug === "super-admin") return true;
  return user.role.permissions.some((rp: { permission: { key: string } }) => rp.permission.key === permission);
}

export function requirePermission(user: CurrentUser | null, permission: PermissionKey) {
  if (!hasPermission(user, permission)) {
    throw new ForbiddenError(`Permissão ausente: ${permission}`);
  }
}

export class ForbiddenError extends Error {
  status = 403;
}

export class UnauthorizedError extends Error {
  status = 401;
}

export function requireUser(user: CurrentUser | null): asserts user is CurrentUser {
  if (!user) throw new UnauthorizedError("Não autenticado");
}

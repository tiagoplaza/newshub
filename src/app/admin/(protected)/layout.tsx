import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/permissions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import "../admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const nav = [
    { section: "Conteúdo" },
    { href: "/admin", label: "Painel", show: true },
    { href: "/admin/posts", label: "Posts", show: true },
    { href: "/admin/pages", label: "Páginas", show: hasPermission(user, PERMISSIONS.PAGES_MANAGE) },
    { href: "/admin/categories", label: "Categorias", show: hasPermission(user, PERMISSIONS.CATEGORIES_MANAGE) },
    { href: "/admin/tags", label: "Tags", show: hasPermission(user, PERMISSIONS.TAGS_MANAGE) },
    { href: "/admin/menus", label: "Menus", show: hasPermission(user, PERMISSIONS.MENUS_MANAGE) },
    { href: "/admin/media", label: "Mídia", show: hasPermission(user, PERMISSIONS.MEDIA_UPLOAD) },
    { section: "Sistema", show: hasPermission(user, PERMISSIONS.USERS_MANAGE) || hasPermission(user, PERMISSIONS.PLUGINS_MANAGE) },
    { href: "/admin/users", label: "Usuários", show: hasPermission(user, PERMISSIONS.USERS_MANAGE) },
    { href: "/admin/plugins", label: "Plugins", show: hasPermission(user, PERMISSIONS.PLUGINS_MANAGE) },
    { href: "/admin/templates", label: "Temas", show: hasPermission(user, PERMISSIONS.TEMPLATES_MANAGE) },
    { href: "/admin/settings/seo", label: "SEO do site", show: hasPermission(user, PERMISSIONS.SETTINGS_MANAGE) },
  ];

  return (
    <div className="admin-shell">
      <AdminSidebar nav={nav} userName={user.name} roleName={user.role.name} />
      <main className="admin-main">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavItem = { href?: string; label?: string; section?: string; show?: boolean };

export function AdminSidebar({ nav, userName, roleName }: { nav: NavItem[]; userName: string; roleName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-masthead">Redação CMS</div>

      <nav style={{ flex: 1 }}>
        {nav.map((item, i) => {
          if (item.show === false) return null;
          if (item.section) return <div key={i} className="admin-nav-section">{item.section}</div>;
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href ?? "~");
          return (
            <Link key={item.href} href={item.href!} className={`admin-nav-link${isActive ? " active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid var(--ink-700)", paddingTop: 12, marginTop: 12 }}>
        <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{userName}</div>
        <div style={{ fontSize: 11.5, color: "#8891a0", marginBottom: 10 }}>{roleName}</div>
        <button onClick={handleLogout} className="btn btn-sm" style={{ width: "100%" }}>
          Sair
        </button>
      </div>
    </aside>
  );
}

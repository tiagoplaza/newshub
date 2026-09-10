import Link from "next/link";
import { getFooterMenu, type MenuItemNode } from "@/lib/site-data";

export async function SiteFooter() {
  const menu = await getFooterMenu();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span>© {new Date().getFullYear()} Redação CMS</span>
        {menu && <div style={{ display: "flex", gap: 16 }}>
          {menu.items.map((item: MenuItemNode) => <Link key={item.id} href={item.url ?? "#"}>{item.label}</Link>)}
        </div>}
      </div>
    </footer>
  );
}

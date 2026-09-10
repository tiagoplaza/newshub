import Link from "next/link";
import { getHeaderMenu, type MenuItemNode } from "@/lib/site-data";

export async function SiteHeader() {
  const menu = await getHeaderMenu();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">Redação</Link>
        {menu && <nav className="site-nav">
          {menu.items.map((item: MenuItemNode) => <div key={item.id} className="site-nav-item">
            <Link href={item.url ?? "#"} className="site-nav-link">{item.label}</Link>
            {item.children.length > 0 && <div className="site-nav-submenu">
              {item.children.map((child: MenuItemNode) => <Link key={child.id} href={child.url ?? "#"}>{child.label}</Link>)}
            </div>}
          </div>)}
        </nav>}
      </div>
    </header>
  );
}

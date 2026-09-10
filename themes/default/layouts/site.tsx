import type { ThemeLayoutProps } from "@/lib/plugins/themes";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export default function SiteLayout({ children }: ThemeLayoutProps) {
  return <><SiteHeader /><main className="site-main">{children}</main><SiteFooter /></>;
}

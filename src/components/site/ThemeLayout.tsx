import type { CSSProperties, ReactNode } from "react";
import { getActiveTheme, getThemeLayout, type ThemeLayoutSlot } from "@/lib/plugins/themes";

interface ThemeLayoutProps {
  slot: ThemeLayoutSlot;
  children: ReactNode;
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string | string[] | number | number[] | undefined>>;
}

/** Renderiza o layout do tema ativo, preservando o conteúdo fornecido pelo CMS. */
export async function ThemeLayout({ slot, children, params, searchParams }: ThemeLayoutProps) {
  const theme = await getActiveTheme();
  if (!theme) return <>{children}</>;

  const Layout = await getThemeLayout(theme, slot);
  const style = {
    "--theme-primary": theme.colors?.primary,
    "--theme-background": theme.colors?.background,
  } as CSSProperties;

  return (
    <div data-theme={theme.slug} style={style}>
      {Layout ? <Layout theme={theme} params={params} searchParams={searchParams}>{children}</Layout> : children}
    </div>
  );
}

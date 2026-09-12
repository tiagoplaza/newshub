import type { Metadata } from "next";
import { ThemeLayout } from "@/components/site/ThemeLayout";
import { prisma } from "@/lib/prisma";
import "../site.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.seoSettings.findUnique({ where: { id: "global" } });
  const verification: Record<string, string> = {};
  if (settings?.googleVerification) verification.google = settings.googleVerification;
  if (settings?.bingVerification) verification.other = settings.bingVerification;

  return {
    title: { default: settings?.siteName ?? "Redação CMS", template: `%s · ${settings?.siteName ?? "Redação CMS"}` },
    description: settings?.siteDescription || undefined,
    openGraph: settings?.defaultOgImage ? { images: [settings.defaultOgImage] } : undefined,
    verification: Object.keys(verification).length ? verification : undefined,
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeLayout slot="site">{children}</ThemeLayout>
  );
}

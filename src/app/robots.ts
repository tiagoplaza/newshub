import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

function getBaseUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

/**
 * Gera robots.txt a partir de SeoSettings.sitemapEnabled. O campo
 * SeoSettings.robotsTxt existe no schema para uma futura tela de admin que
 * permita colar regras extras — hoje o essencial (bloquear /admin, expor o
 * sitemap) já sai correto sem precisar de configuração manual.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await prisma.seoSettings.findUnique({ where: { id: "global" } });
  const baseUrl = getBaseUrl();

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: settings?.sitemapEnabled === false ? undefined : `${baseUrl}/sitemap.xml`,
  };
}

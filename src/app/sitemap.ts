import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

function getBaseUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const [posts, pages] = await Promise.all([
    prisma.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...posts.map((post: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/noticia/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pages.map((page: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}

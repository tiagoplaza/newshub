import { prisma } from "@/lib/prisma";

function getBaseUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

export async function GET() {
  const baseUrl = getBaseUrl();

  const [settings, posts, pages, categories] = await Promise.all([
    prisma.seoSettings.findUnique({ where: { id: "global" } }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, slug: true, excerpt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 12,
    }),
    prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, slug: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.category.findMany({
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
      take: 12,
    }),
  ]);

  const siteName = settings?.siteName ?? "Redação CMS";
  const siteDescription = settings?.siteDescription ?? "Portal de notícias e conteúdo editorial.";

  const lines = [
    `# ${siteName}`,
    "",
    siteDescription,
    "",
    "## Visão geral",
    `- Homepage: [${baseUrl}](${baseUrl})`,
    `- Sitemap: [${baseUrl}/sitemap.xml](${baseUrl}/sitemap.xml)`,
    `- Robots: [${baseUrl}/robots.txt](${baseUrl}/robots.txt)`,
    "",
    "## Páginas importantes",
    ...pages.map((page) => `- [${page.title}](${baseUrl}/${page.slug})`),
    "",
    "## Categorias",
    ...categories.map((category) => `- [${category.name}](${baseUrl}/categoria/${category.slug})`),
    "",
    "## Últimas notícias",
    ...posts.map(
      (post) =>
        `- [${post.title}](${baseUrl}/noticia/${post.slug})${
          post.excerpt ? ` — ${post.excerpt.replace(/\s+/g, " ").slice(0, 120)}` : ""
        }`,
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

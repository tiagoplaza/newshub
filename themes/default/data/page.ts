const pageInclude = {
  author: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.PageInclude;

type PageContent = {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: Date;
  sourceName: string;
  sourceUrl: string | null;
  url: string;
  type: string;
};

export async function getPage(
  slug?: string
): Promise<PageContent| null> {
  const pages = await prisma.page.findFirst({
    where: {
      status: "PUBLISHED",
      ...(slug ? { slug } : {}),
    },
    include: pageInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Trata o valor nulo antes de passar para o mapper
  if (!pages) {
    return null;
  }

  return pages;
}
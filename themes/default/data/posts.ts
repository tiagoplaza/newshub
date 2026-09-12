import { prisma } from "@/lib/prisma";

type HomeContentType =
  | "POST"
  | "NEWS"
  | "VIDEO"
  | "EVENT";

type HomeContent = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  categorySlug: string;
  categoryName: string;
  sourceName: string;
  sourceUrl: string | null;
  url: string;
  type: HomeContentType;
  authorName: string | null;
  tag?: {
    name: string | null;
    slug: string | null;
  }
}

type HomeContentPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  publishedAt: Date | null;
  author: {
    name: string;
  } | null;
  categories: Array<{
    category: {
      slug: string;
      name: string;
    };
  }>;
};

const postInclude = {
  author: { select: { name: true } },
  categories: { include: { category: true } },
} as const;

const postOrderBy = [
  { publishedAt: "desc" as const },
  { createdAt: "desc" as const },
];

export async function getPosts(
  slug?: string
): Promise<HomeContent[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      ...(slug
        ? { categories: { some: { category: { slug } } } }
        : {}),
    },
    include: postInclude,
    orderBy: { publishedAt: "desc" },
  });
  return posts;
}

export async function getSlugPosts(
  slug?: string
): Promise<PostContent | null> {
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      author: { select: { name: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      seo: true,
    },
  });
  if (!post) { return null; }
  const category = post.categories[0]?.category;
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    imageUrl: post.featuredImage,
    publishedAt: post.publishedAt!,
    categorySlug: category?.slug ?? "geral",
    categoryName: category?.name ?? "Geral",
    sourceName: "site",
    sourceUrl: null,
    url: `/noticia/${post.slug}`,
    type: "POST",
    authorName: post.author?.name ?? null,
    tags: post.tags.map(({ tag }) => ({
      id: tag.id,
      createdAt: tag.createdAt,
      name: tag.name,
      slug: tag.slug,
    })),
  };
}

export async function getPostsCategory(
  slug?: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedHomeContent> {
  const where = createPublishedWhere(
    slug
      ? { categories: { some: { category: { slug } } } }
      : undefined
  );
  const { posts, total } = await getPaginatedPosts(
    where,
    page,
    limit
  );

  return {
    posts: toHomeContents(posts),
    pagination: createPagination(page, limit, total),
  };
}

function getCategory(post: HomeContentPost) {
  return post.categories[0]?.category;
}

function toHomeContent(post: HomeContentPost): HomeContent {
  const category = getCategory(post);
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    imageUrl: post.featuredImage,
    publishedAt: post.publishedAt!,
    categorySlug: category?.slug ?? "geral",
    categoryName: category?.name ?? "Geral",
    sourceName: "site",
    sourceUrl: null,
    url: `/noticia/${post.slug}`,
    type: "POST",
    authorName: post.author?.name ?? null,
  };
}

function toHomeContents(posts: HomeContentPost[]): HomeContent[] {
  return posts
    .filter((post) => post.publishedAt)
    .map(toHomeContent);
}

function createPublishedWhere(
  where?: Record<string, unknown>
) {
  return {
    status: "PUBLISHED" as const,
    ...where,
  };
}

function createPagination(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
}

async function getPaginatedPosts(
  where: Record<string, unknown>,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;
  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: postOrderBy,
      skip,
      take: limit,
    }),
    prisma.post.count({
      where,
    }),
  ]);
  return { posts, total };
}
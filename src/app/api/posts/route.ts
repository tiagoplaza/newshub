import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { hooks, CoreHooks } from "@/lib/plugins/hooks";

const createPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string(),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  categoryIds: z.array(z.string()).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).default("DRAFT"),
});

// GET /api/posts?status=PUBLISHED&category=slug&page=1&pageSize=20
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const status = params.get("status") ?? undefined;
    const categorySlug = params.get("category") ?? undefined;
    const page = Number(params.get("page") ?? "1");
    const pageSize = Math.min(Number(params.get("pageSize") ?? "20"), 100);

    const where = {
      ...(status ? { status: status as never } : {}),
      ...(categorySlug ? { categories: { some: { category: { slug: categorySlug } } } } : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { author: { select: { id: true, name: true } }, categories: { include: { category: true } }, tags: { include: { tag: true } }, seo: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/posts
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.POSTS_CREATE)) {
      return NextResponse.json({ error: "Sem permissão para criar posts" }, { status: 403 });
    }

    const body = createPostSchema.parse(await req.json());

    if (body.status === "PUBLISHED" && !hasPermission(user, PERMISSIONS.POSTS_PUBLISH)) {
      return NextResponse.json({ error: "Sem permissão para publicar diretamente" }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: {
        title: body.title,
        slug: body.slug,
        content: body.content,
        excerpt: body.excerpt,
        featuredImage: body.featuredImage,
        status: body.status,
        authorId: user.id,
        publishedAt: body.status === "PUBLISHED" ? new Date() : null,
        categories: { create: body.categoryIds.map((categoryId) => ({ categoryId })) },
        tags: { create: body.tagIds.map((tagId) => ({ tagId })) },
      },
      include: { categories: true, tags: true },
    });

    await hooks.doAction(CoreHooks.POST_CREATED, post);
    if (post.status === "PUBLISHED") {
      await hooks.doAction(CoreHooks.POST_PUBLISHED, post);
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

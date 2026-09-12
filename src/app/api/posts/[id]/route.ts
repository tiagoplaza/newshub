import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { hooks, CoreHooks } from "@/lib/plugins/hooks";

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

async function canEditPost(userId: string, postAuthorId: string, user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (hasPermission(user, PERMISSIONS.POSTS_EDIT_ANY)) return true;
  if (hasPermission(user, PERMISSIONS.POSTS_EDIT_OWN) && userId === postAuthorId) return true;
  return false;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: true, categories: { include: { category: true } }, tags: { include: { tag: true } }, seo: true },
    });
    if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    requireUser(user);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

    if (!(await canEditPost(user.id, existing.authorId, user))) {
      return NextResponse.json({ error: "Sem permissão para editar este post" }, { status: 403 });
    }

    const body = updatePostSchema.parse(await req.json());

    if (body.status === "PUBLISHED" && !hasPermission(user, PERMISSIONS.POSTS_PUBLISH)) {
      return NextResponse.json({ error: "Sem permissão para publicar" }, { status: 403 });
    }

    // Guarda revisão antes de sobrescrever
    await prisma.postRevision.create({
      data: { postId: id, title: existing.title, content: existing.content, editedBy: user.id },
    });

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
        ...(body.featuredImage !== undefined && { featuredImage: body.featuredImage }),
        ...(body.status && { status: body.status, publishedAt: body.status === "PUBLISHED" ? new Date() : existing.publishedAt }),
        ...(body.categoryIds && { categories: { deleteMany: {}, create: body.categoryIds.map((categoryId) => ({ categoryId })) } }),
        ...(body.tagIds && { tags: { deleteMany: {}, create: body.tagIds.map((tagId) => ({ tagId })) } }),
      },
    });

    if (body.status === "PUBLISHED") {
      await hooks.doAction(CoreHooks.POST_PUBLISHED, post);
    }

    return NextResponse.json({ post });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    requireUser(user);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

    const canDelete =
      hasPermission(user, PERMISSIONS.POSTS_DELETE_ANY) ||
      (hasPermission(user, PERMISSIONS.POSTS_DELETE_OWN) && existing.authorId === user.id);

    if (!canDelete) {
      return NextResponse.json({ error: "Sem permissão para excluir este post" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });
    await hooks.doAction(CoreHooks.POST_DELETED, existing);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

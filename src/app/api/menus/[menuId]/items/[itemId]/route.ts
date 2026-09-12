import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  url: z.string().optional(),
  pageId: z.string().nullable().optional(),
  postId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
  openInNewTab: z.boolean().optional(),
});

async function assertCanManage() {
  const user = await getCurrentUser();
  requireUser(user);
  if (!hasPermission(user, PERMISSIONS.MENUS_MANAGE)) {
    throw Object.assign(new Error("Sem permissão"), { status: 403 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    await assertCanManage();
    const { itemId } = await params;
    const body = updateSchema.parse(await req.json());
    const item = await prisma.menuItem.update({ where: { id: itemId }, data: body });
    return NextResponse.json({ item });
  } catch (error) {
    return handleApiError(error);
  }
}

// Excluir um item de menu também remove seus submenus (onDelete: Cascade no schema)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    await assertCanManage();
    const { itemId } = await params;
    await prisma.menuItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

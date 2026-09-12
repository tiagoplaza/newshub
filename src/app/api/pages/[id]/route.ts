import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  template: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
});

async function assertCanManage() {
  const user = await getCurrentUser();
  requireUser(user);
  if (!hasPermission(user, PERMISSIONS.PAGES_MANAGE)) {
    throw Object.assign(new Error("Sem permissão"), { status: 403 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertCanManage();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    const page = await prisma.page.update({ where: { id }, data: body });
    return NextResponse.json({ page });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertCanManage();
    const { id } = await params;
    await prisma.page.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

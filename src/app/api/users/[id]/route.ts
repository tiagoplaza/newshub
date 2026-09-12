import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  roleId: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    const updated = await prisma.user.update({
      where: { id },
      data: body,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const { id } = await params;
    if (id === user.id) {
      return NextResponse.json({ error: "Não é possível excluir o próprio usuário logado" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

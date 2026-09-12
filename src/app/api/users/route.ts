import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { hashPassword } from "@/lib/auth/session";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, active: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const body = createUserSchema.parse(await req.json());
    const passwordHash = await hashPassword(body.password);
    const created = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash, roleId: body.roleId },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

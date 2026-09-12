import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ roles });
  } catch (error) {
    return handleApiError(error);
  }
}

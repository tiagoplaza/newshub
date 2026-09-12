import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { listAvailableThemes } from "@/lib/plugins/themes";

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.TEMPLATES_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const templates = await listAvailableThemes();
    return NextResponse.json({ templates });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { listAvailablePlugins } from "@/lib/plugins/registry";

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.PLUGINS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const plugins = await listAvailablePlugins();
    return NextResponse.json({ plugins });
  } catch (error) {
    return handleApiError(error);
  }
}

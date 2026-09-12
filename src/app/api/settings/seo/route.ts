import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";

const settingsSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string().optional(),
  defaultOgImage: z.string().optional(),
  robotsTxt: z.string().optional(),
  sitemapEnabled: z.boolean().default(true),
  googleVerification: z.string().optional(),
  bingVerification: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.SEO_MANAGE) && !hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const settings = await prisma.seoSettings.findUnique({ where: { id: "global" } });
    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const body = settingsSchema.parse(await req.json());

    const settings = await prisma.seoSettings.upsert({
      where: { id: "global" },
      create: { id: "global", ...body },
      update: body,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

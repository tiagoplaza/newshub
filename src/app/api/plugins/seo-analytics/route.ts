import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ForbiddenError, hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { SEO_ANALYTICS_SLUG, type SeoAnalyticsSettings } from "../../../../../plugins/seo-analytics";

const settingsSchema = z.object({
  gtmId: z.string().regex(/^GTM-[A-Z0-9]+$/i, "Formato inválido, use GTM-XXXXXXX").optional().or(z.literal("")),
  gaId: z.string().regex(/^G-[A-Z0-9]+$/i, "Formato inválido, use G-XXXXXXXXXX").optional().or(z.literal("")),
  adsenseClientId: z
    .string()
    .regex(/^ca-pub-\d+$/, "Formato inválido, use ca-pub-XXXXXXXXXXXXXXXX")
    .optional()
    .or(z.literal("")),
  enableSeoDefaults: z.boolean().optional(),
});

async function authorized() {
  const user = await getCurrentUser();
  requireUser(user);
  if (!hasPermission(user, PERMISSIONS.PLUGINS_MANAGE)) throw new ForbiddenError("Sem permissão");
  return user;
}

async function pluginSettings() {
  const plugin = await prisma.plugin.findUnique({ where: { slug: SEO_ANALYTICS_SLUG } });
  const settings =
    plugin?.settings && typeof plugin.settings === "object"
      ? (plugin.settings as unknown as SeoAnalyticsSettings)
      : {};
  return { plugin, settings };
}

export async function GET() {
  try {
    await authorized();
    const { plugin, settings } = await pluginSettings();
    return NextResponse.json({ active: plugin?.active ?? false, ...settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await authorized();
    const body = settingsSchema.parse(await req.json());
    const settings: SeoAnalyticsSettings = {
      gtmId: body.gtmId || undefined,
      gaId: body.gaId || undefined,
      adsenseClientId: body.adsenseClientId || undefined,
      enableSeoDefaults: body.enableSeoDefaults ?? true,
    };
    await prisma.plugin.update({
      where: { slug: SEO_ANALYTICS_SLUG },
      data: { settings: JSON.parse(JSON.stringify(settings)) },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
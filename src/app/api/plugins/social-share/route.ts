import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ForbiddenError, hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { SOCIAL_SHARE_SLUG, type SocialShareSettings } from "../../../../../plugins/social-share";

const socialIconSchema = z.enum(["facebook", "x", "linkedin", "whatsapp", "telegram", "mail", "copy"]);

const networkSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome da rede").max(80),
  icon: socialIconSchema,
  active: z.boolean().optional().default(true),
});

const settingsSchema = z.object({
  networks: z.array(networkSchema).default([]),
});

async function authorized() {
  const user = await getCurrentUser();
  requireUser(user);
  if (!hasPermission(user, PERMISSIONS.PLUGINS_MANAGE)) throw new ForbiddenError("Sem permissão");
  return user;
}

async function pluginSettings() {
  const plugin = await prisma.plugin.findUnique({ where: { slug: SOCIAL_SHARE_SLUG } });
  const settings =
    plugin?.settings && typeof plugin.settings === "object"
      ? (plugin.settings as unknown as SocialShareSettings)
      : { networks: [] };

  return {
    plugin,
    settings: {
      networks: Array.isArray(settings.networks) ? settings.networks : [],
    } as SocialShareSettings,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user && !hasPermission(user, PERMISSIONS.PLUGINS_MANAGE)) {
      return NextResponse.json({ active: false, networks: [] });
    }

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
    const data: SocialShareSettings = {
      networks: body.networks.map((network) => ({
        id: network.id ?? crypto.randomUUID(),
        name: network.name,
        icon: network.icon,
        active: network.active ?? true,
      })),
    };

    await prisma.plugin.upsert({
      where: { slug: SOCIAL_SHARE_SLUG },
      create: {
        slug: SOCIAL_SHARE_SLUG,
        name: "Social Share",
        version: "1.0.0",
        description: "Redes sociais e compartilhamento do site",
        active: true,
        settings: JSON.parse(JSON.stringify(data)),
      },
      update: { settings: JSON.parse(JSON.stringify(data)) },
    });

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

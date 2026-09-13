import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import {
  ForbiddenError,
  hasPermission,
  requireUser,
  PERMISSIONS,
} from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import {
  ADCASH_SLUG,
  type AdCashSettings,
  DEFAULT_ADCASH_AUTO_TAG_ZONE_ID,
} from "../../../../../plugins/adcash";

const zoneId = z
  .string()
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Zone ID inválido",
  )
  .optional()
  .or(z.literal(""));

const bannerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Nome do banner é obrigatório"),
  zoneId: zoneId,
  renderIn: z
    .string()
    .min(1, "Render In é obrigatório"),
  enabled: z.boolean(),
});

const settingsSchema = z.object({
  autoTagZoneId: zoneId,
  enableAutoTag: z.boolean().optional(),
  banners: z.array(bannerSchema).optional(),
});

async function authorized() {
  const user = await getCurrentUser();

  requireUser(user);

  if (!hasPermission(user, PERMISSIONS.PLUGINS_MANAGE)) {
    throw new ForbiddenError("Sem permissão");
  }
}

export async function GET() {
  try {
    await authorized();

    const plugin = await prisma.plugin.findUnique({
      where: {
        slug: ADCASH_SLUG,
      },
    });

    const settings =
      plugin?.settings &&
      typeof plugin.settings === "object"
        ? (plugin.settings as unknown as AdCashSettings)
        : {};

    return NextResponse.json({
      active: plugin?.active ?? false,

      autoTagZoneId:
        settings.autoTagZoneId ??
        DEFAULT_ADCASH_AUTO_TAG_ZONE_ID,

      enableAutoTag:
        settings.enableAutoTag ?? true,

      banners: settings.banners ?? [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await authorized();

    const body = settingsSchema.parse(
      await req.json(),
    );

    const settings: AdCashSettings = {
      autoTagZoneId:
        body.autoTagZoneId || undefined,

      enableAutoTag:
        body.enableAutoTag ?? true,

      banners: (body.banners ?? []).map((banner) => ({
        id: banner.id,
        name: banner.name,
        zoneId: banner.zoneId || "",
        renderIn: banner.renderIn,
        enabled: banner.enabled,
      })),
    };

    await prisma.plugin.upsert({
      where: {
        slug: ADCASH_SLUG,
      },

      create: {
        slug: ADCASH_SLUG,
        name: "AdCash",
        version: "1.0.0",
        active: false,
        settings: JSON.parse(
          JSON.stringify(settings),
        ),
      },

      update: {
        settings: JSON.parse(
          JSON.stringify(settings),
        ),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

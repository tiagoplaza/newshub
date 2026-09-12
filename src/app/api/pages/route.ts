import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";
import { hooks, CoreHooks } from "@/lib/plugins/hooks";

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string(),
  template: z.string().default("default"),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).default("DRAFT"),
});

export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      include: { children: true, author: { select: { id: true, name: true } } },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ pages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.PAGES_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const body = pageSchema.parse(await req.json());
    const page = await prisma.page.create({ data: { ...body, authorId: user.id } });

    if (page.status === "PUBLISHED") {
      await hooks.doAction(CoreHooks.PAGE_PUBLISHED, page);
    }

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

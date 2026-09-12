import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";

// parentId presente = cria um submenu (item filho de outro item)
const itemSchema = z.object({
  label: z.string().min(1),
  url: z.string().optional(),
  pageId: z.string().optional(),
  postId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
  openInNewTab: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ menuId: string }> }) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.MENUS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const { menuId } = await params;
    const body = itemSchema.parse(await req.json());
    const item = await prisma.menuItem.create({ data: { ...body, menuId } });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

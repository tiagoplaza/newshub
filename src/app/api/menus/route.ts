import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, requireUser, PERMISSIONS } from "@/lib/rbac/permissions";
import { handleApiError } from "@/lib/api-error";

const menuSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  location: z.string().optional(),
});

// GET /api/menus — cada menu já vem com os itens organizados em árvore
export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: { items: { orderBy: { order: "asc" } } },
    });

    const withTree = menus.map((menu: { items: { id: string; parentId: string | null }[] } & Record<string, unknown>) => ({
      ...menu,
      items: buildTree(menu.items),
    }));

    return NextResponse.json({ menus: withTree });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireUser(user);
    if (!hasPermission(user, PERMISSIONS.MENUS_MANAGE)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const body = menuSchema.parse(await req.json());
    const menu = await prisma.menu.create({ data: body });
    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// Monta a árvore de menu > submenu a partir da lista plana (parentId)
function buildTree<T extends { id: string; parentId: string | null }>(items: T[]): (T & { children: T[] })[] {
  const byId = new Map(items.map((item) => [item.id, { ...item, children: [] as T[] }]));
  const roots: (T & { children: T[] })[] = [];

  for (const item of byId.values()) {
    if (item.parentId) {
      const parent = byId.get(item.parentId);
      if (parent) parent.children.push(item);
    } else {
      roots.push(item);
    }
  }
  return roots;
}

import { prisma } from "@/lib/prisma";

export async function getPostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { name: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      seo: true,
    },
  });
}

export async function getPageBySlug(slug: string) {
  return prisma.page.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { seo: true },
  });
}

interface FlatItem { id: string; label: string; url: string | null; parentId: string | null; }

export interface MenuItemNode extends FlatItem {
  children: MenuItemNode[];
}

export async function getHeaderMenu(): Promise<{ items: MenuItemNode[] } | null> {
  const menu = await prisma.menu.findFirst({
    where: { location: "HEADER" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!menu) return null;
  return { ...menu, items: buildTree(menu.items) };
}

export async function getFooterMenu(): Promise<{ items: MenuItemNode[] } | null> {
  const menu = await prisma.menu.findFirst({
    where: { location: "FOOTER" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!menu) return null;
  return { ...menu, items: buildTree(menu.items) };
}

// function buildTree<T extends FlatItem>(items: T[]): (T & { children: T[] })[] {
//   const byId = new Map(items.map((item) => [item.id, { ...item, children: [] as T[] }]));
//   const roots: (T & { children: T[] })[] = [];
//   for (const item of byId.values()) {
//     if (item.parentId) {
//       byId.get(item.parentId)?.children.push(item);
//     } else {
//       roots.push(item);
//     }
//   }
//   return roots;
// }

function buildTree(items: FlatItem[]): MenuItemNode[] {
  const byId = new Map<string, MenuItemNode>();

  for (const item of items) {
    byId.set(item.id, {
      ...item,
      children: [],
    });
  }

  const roots: MenuItemNode[] = [];

  for (const item of byId.values()) {
    if (item.parentId) {
      byId.get(item.parentId)?.children.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}

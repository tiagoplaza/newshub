import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ComponentType, ReactNode } from "react";
import { prisma } from "@/lib/prisma";

export type ThemeLayoutSlot = "site" | "home" | "post" | "page" | "category" | "tag" | "search";

type Params = {
  slug?: string
}

export interface ThemeManifest {
  slug: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  /** Caminhos relativos à pasta do tema. */
  layouts: Partial<Record<ThemeLayoutSlot, string>>;
  /** Views opcionais que permitem ao tema organizar os dados do CMS. */
  views?: Partial<Record<"home", string>>;
  menuSlots: string[];
  colors?: Record<string, string>;
}

export interface ThemeLayoutProps {
  children: ReactNode;
  theme: ThemeManifest;
  params?: Promise<Params>
  searchParams?: Promise<Record<string, string | string[] | number | number[] | undefined>>;
}

export type ThemeLayoutComponent = ComponentType<ThemeLayoutProps>;

export interface ThemeListEntry {
  slug: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  active: boolean;
}

const THEMES_DIR = path.join(process.cwd(), "themes");
const VALID_SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const VALID_LAYOUT_PATH = /^layouts\/[a-zA-Z0-9_./-]+\.(?:tsx|ts)$/;
const VALID_VIEW_PATH = /^components\/[a-zA-Z0-9_./-]+\.(?:tsx|ts)$/;

function isValidSlug(slug: string): boolean {
  return VALID_SLUG.test(slug);
}

function isValidLayoutPath(layoutPath: string): boolean {
  return VALID_LAYOUT_PATH.test(layoutPath) && !layoutPath.includes("..") && !layoutPath.includes("\\");
}

function isThemeLayoutSlot(slot: string): slot is ThemeLayoutSlot {
  return ["site", "home", "post", "page", "category", "tag", "search"].includes(slot);
}

async function discoverThemeSlugs(): Promise<string[]> {
  const entries = await readdir(THEMES_DIR, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).filter(isValidSlug);
}

async function discoverThemeManifests(): Promise<ThemeManifest[]> {
  const results = await Promise.allSettled((await discoverThemeSlugs()).map(loadThemeManifest));
  return results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
}

/** Lê e valida somente o manifesto dentro de themes/<slug>/theme.json. */
async function loadThemeManifest(slug: string): Promise<ThemeManifest> {
  if (!isValidSlug(slug)) throw new Error(`Slug de tema inválido: ${slug}`);

  const manifestPath = path.join(THEMES_DIR, slug, "theme.json");
  const manifest: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!manifest || typeof manifest !== "object") throw new Error(`Manifesto inválido para o tema "${slug}"`);

  const candidate = manifest as Partial<ThemeManifest>;
  if (candidate.slug !== slug) throw new Error(`Manifesto do tema "${slug}" possui slug incompatível`);
  if (typeof candidate.name !== "string" || !candidate.name.trim()) throw new Error(`Tema "${slug}" não possui "name"`);
  if (typeof candidate.version !== "string" || !candidate.version.trim()) throw new Error(`Tema "${slug}" não possui "version"`);
  if (!candidate.layouts || typeof candidate.layouts !== "object" || Array.isArray(candidate.layouts)) {
    throw new Error(`Tema "${slug}" não possui um objeto "layouts" válido`);
  }
  if (!Array.isArray(candidate.menuSlots) || !candidate.menuSlots.every((slot) => typeof slot === "string")) {
    throw new Error(`Tema "${slug}" não possui "menuSlots" válido`);
  }

  for (const [slot, layoutPath] of Object.entries(candidate.layouts)) {
    if (!isThemeLayoutSlot(slot) || typeof layoutPath !== "string" || !isValidLayoutPath(layoutPath)) {
      throw new Error(`Layout inválido no tema "${slug}": ${slot}`);
    }
  }
  if (candidate.views && (typeof candidate.views !== "object" || Array.isArray(candidate.views))) {
    throw new Error(`Tema "${slug}" possui "views" inválido`);
  }
  for (const [view, viewPath] of Object.entries(candidate.views ?? {})) {
    if (view !== "home" || typeof viewPath !== "string" || !VALID_VIEW_PATH.test(viewPath) || viewPath.includes("..") || viewPath.includes("\\")) {
      throw new Error(`View inválida no tema "${slug}": ${view}`);
    }
  }

  return candidate as ThemeManifest;
}

/**
 * Descobre automaticamente qualquer pasta válida em /themes. O banco guarda
 * apenas qual tema está ativo; o manifesto continua sendo a fonte da verdade.
 */
export async function listAvailableThemes(): Promise<ThemeListEntry[]> {
  const manifests = await discoverThemeManifests();
  const installed = await prisma.template.findMany({ select: { slug: true, active: true } });
  const activeBySlug = new Map(installed.map((theme) => [theme.slug, theme.active]));

  const missing = manifests.filter((theme) => !activeBySlug.has(theme.slug));
  if (missing.length) {
    await prisma.$transaction(missing.map((theme) => prisma.template.create({
      data: { slug: theme.slug, name: theme.name, version: theme.version, active: false },
    })));
  }

  return manifests.map((theme) => ({
    slug: theme.slug,
    name: theme.name,
    version: theme.version,
    author: theme.author,
    description: theme.description,
    active: activeBySlug.get(theme.slug) ?? false,
  }));
}

export async function getActiveTheme(): Promise<ThemeManifest | null> {
  const record = await prisma.template.findFirst({ where: { active: true }, select: { slug: true } });
  if (!record) return null;
  try {
    return await loadThemeManifest(record.slug);
  } catch {
    return null;
  }
}

/**
 * Carrega um layout declarado pelo manifesto do tema ativo. O caminho é
 * validado antes do import. Ao adicionar um tema em desenvolvimento, reinicie
 * o servidor para que o bundler inclua os módulos novos.
 */
export async function getThemeLayout(theme: ThemeManifest, slot: ThemeLayoutSlot): Promise<ThemeLayoutComponent | null> {
  const layoutPath = theme.layouts[slot];
  if (!layoutPath) return null;

  try {
    const module = await import(
      /* webpackInclude: /layouts\/.*\.(tsx|ts)$/ */
      `../../../themes/${theme.slug}/${layoutPath}`
    );
    return typeof module.default === "function" ? module.default as ThemeLayoutComponent : null;
  } catch (error) {
    console.error(`Não foi possível carregar o layout "${slot}" do tema "${theme.slug}"`, error);
    return null;
  }
}

export async function getThemeView<TProps>(theme: ThemeManifest, view: "home"): Promise<ComponentType<TProps> | null> {
  const viewPath = theme.views?.[view];
  if (!viewPath) return null;
  try {
    const module = await import(
      /* webpackInclude: /components\/.*\.(tsx|ts)$/ */
      `../../../themes/${theme.slug}/${viewPath}`
    );
    return typeof module.default === "function" ? module.default as ComponentType<TProps> : null;
  } catch (error) {
    console.error(`Não foi possível carregar a view "${view}" do tema "${theme.slug}"`, error);
    return null;
  }
}

export async function activateTheme(slug: string) {
  const manifest = await loadThemeManifest(slug);
  await prisma.$transaction([
    prisma.template.updateMany({ data: { active: false } }),
    prisma.template.upsert({
      where: { slug: manifest.slug },
      create: { slug: manifest.slug, name: manifest.name, version: manifest.version, active: true },
      update: { name: manifest.name, version: manifest.version, active: true },
    }),
  ]);
}

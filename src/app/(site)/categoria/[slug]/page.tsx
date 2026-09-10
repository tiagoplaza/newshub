import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ThemeLayout } from "@/components/site/ThemeLayout";

const PAGE_SIZE = 8;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return {};
  return { 
    title: category.name, 
    description: category.description ?? `Fique por dentro das últimas notícias, análises exclusivas e atualizações sobre ${category.name}.`,
    alternates: {
      canonical: `${process.env.SITE_URL}/categoria/${slug}`
    }
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  return (
    <ThemeLayout slot="category" params={params}/>
  );
}

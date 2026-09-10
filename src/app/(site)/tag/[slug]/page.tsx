import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ThemeLayout } from "@/components/site/ThemeLayout";

const PAGE_SIZE = 8;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) return {};
  return { 
    title: `#${tag.name}`,
    alternates: {
      canonical: `${process.env.SITE_URL}/tag/${slug}`
    }
  };
}

export default async function TagPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  return (
    <ThemeLayout slot="tag" params={params}/>
  );
}

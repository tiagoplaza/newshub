import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/site-data";
import { hooks, CoreHooks } from "@/lib/plugins/hooks";
import { ThemeLayout } from "@/components/site/ThemeLayout";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const seo = post.seo ? await hooks.applyFilters(CoreHooks.SEO_META_OUTPUT, post.seo) : null;

  return {
    title: seo?.metaTitle || post.title,
    description: seo?.metaDescription || post.excerpt || undefined,
    robots: seo?.noIndex ? { index: false, follow: !seo.noFollow } : undefined,
    openGraph: {
      title: seo?.ogTitle || post.title,
      description: seo?.ogDescription || post.excerpt || undefined,
      images: seo?.ogImage || post.featuredImage ? [seo?.ogImage || post.featuredImage!] : undefined,
    },
    alternates: {
      canonical: seo?.canonicalUrl || `${process.env.SITE_URL}/${slug}`,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ThemeLayout slot="post" params={params}/>
  );
}

import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/site-data";
import { ThemeLayout } from "@/components/site/ThemeLayout";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ThemeLayout slot="post" params={params}/>
  );
}

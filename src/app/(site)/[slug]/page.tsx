import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeLayout } from "@/components/site/ThemeLayout";

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {

  return (
    <ThemeLayout slot="page" params={params}/>
  );
}

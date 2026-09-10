import { ThemeLayout } from "@/components/site/ThemeLayout";

export default async function BuscaPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string, q?: string }> }) {
  const search = await searchParams;
  const page = Math.max(1, Number(search.page) || 1);
  

  return (
    <ThemeLayout slot="search" params={params} searchParams={searchParams}/>
  );
}

import Image from "next/image";
import Link from "next/link";

import type { ThemeLayoutProps } from "@/lib/plugins/themes";
import { getPostsTagContent, getCategoryContent } from "../data";
export default async function TagLayout({params}: ThemeLayoutProps) { 
    const { slug } = (await params) ?? {};
    const { posts, pagination } = await getPostsTagContent(slug);
    const articles = await getCategoryContent();
    const { tag } = posts[0];
    if (!tag) return [];
    return (
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-10">
            <header className="mb-8 border-b border-neutral-200 pb-6">
                <h1 className="text-3xl font-bold">
                    {tag.name}
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Notícias relacionadas a <span className="text-red-600">{tag.name}</span>.
                </p>
            </header>
            <section className="gap-10">
                {posts.map(article => (
                <article
                    key={article.slug}
                    className="flex flex-col gap-5 border-b border-neutral-200 pb-8 last:border-none lg:flex-row"
                >
                    <Link
                    href={`/noticia/${article.slug}`}
                    className="relative aspect-video overflow-hidden rounded-lg lg:w-80"
                    >
                    <Image
                        src={article.imageUrl || "/placeholder.jpg"}
                        alt={article.title}
                        fill
                        unoptimized
                        className="object-cover transition duration-300 hover:scale-105"
                    />
                    </Link>
                    <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-red-600">
                        {article.categoryName}
                    </span>
                    <Link href={`/noticia/${article.slug}`}>
                        <h3 className="mt-2 text-2xl font-bold leading-tight transition">
                        {article.title}
                        </h3>
                    </Link>
                    <p className="mt-3 line-clamp-3 text-neutral-600">
                        {article.excerpt}
                    </p>
                    </div>
                </article>
                ))}
            </section>
        </main>
    ); 
}

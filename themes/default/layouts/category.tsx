import Image from "next/image";
import Link from "next/link";

import type { ThemeLayoutProps } from "@/lib/plugins/themes";
import { getPostsCategoryContent } from "../data";
export default async function CategoryLayout({params}: ThemeLayoutProps) {
    const { slug } = (await params) ?? {};
    const contents = await getPostsCategoryContent(slug); 

    if (!contents) return <main>Notícia não encontrada.</main>;
    return (
        <section>
            <div className="space-y-8">
                {contents.posts.map(article => (
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
            </div>
        </section>
    )
}

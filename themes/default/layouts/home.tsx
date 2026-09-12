import Image from "next/image";
import Link from "next/link";

import type { ThemeLayoutProps } from "@/lib/plugins/themes";
import { getHomeContent } from "../data";
export default async function HomeLayout({ children }: ThemeLayoutProps) { 
    const contents = await getHomeContent();
    
    if (!contents || !contents.length) return <main>Nenhum post publicado ainda.</main>;
    return (
        <section>
            <div className="space-y-8">
                {contents.map(article => (
                <article
                    key={article.slug}
                    className="flex flex-col gap-5 border-b border-neutral-200 pb-8 last:border-none lg:flex-row"
                >
                    <Link
                    href={`/noticia/${article.slug}`}
                    className="relative aspect-video overflow-hidden rounded-lg lg:w-80"
                    >
                    <Image
                        src={article.featuredImage || "/placeholder.jpg"}
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

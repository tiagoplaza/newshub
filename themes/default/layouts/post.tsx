import Image from "next/image";
import Link from "next/link";
import type { ThemeLayoutProps } from "@/lib/plugins/themes";
import { getPostContent } from "../data";

export default async function PostLayout({params}: ThemeLayoutProps) {
    const { slug } = (await params) ?? {};
    console.log("SLUG: ", slug)
    const contents = await getPostContent(slug); 

    console.log("contents: ", contents)
    if (!contents) return <main>Notícia não encontrada.</main>;
    return (
        <article>
            {contents.content ? (
                <>
                    <header className="border-b border-gray-200 pb-8">
                        <Link
                            href={`/categoria/${contents.categorySlug}`}
                            className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition"
                        >
                            {contents.categoryName}
                        </Link>
                        <h1 className="min-w-full mt-5 max-w-5xl text-4xl font-black leading-tight text-gray-900 md:text-5xl">
                            {contents.title}
                        </h1>
                        <p className="min-w-full mt-5 max-w-4xl text-xl leading-relaxed text-gray-600">
                            {contents.excerpt}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                            <span>
                                <strong className="text-gray-800">
                                    {contents?.authorName ?? "Redação"}
                                </strong>
                            </span>
                            <span>•</span>
                            <span>{formatDate(contents.publishedAt)}</span>
                            {contents.sourceUrl && (
                                <>
                                    <span>•</span>
                                    <a
                                        href={contents.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-red-600 hover:underline"
                                    >
                                        Ler matéria original →
                                    </a>
                                </>
                            )}
                        </div>
                        {contents.imageUrl && (
                            <figure className="mt-8 overflow-hidden rounded-xl border border-gray-200">
                                <div className="relative aspect-[16/9] w-full object-cover">
                                    <Image
                                        src={contents.imageUrl}
                                        alt={contents.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 768px"
                                    />
                                </div>
                                <figcaption className="bg-gray-50 px-4 py-3 text-xs text-gray-500">
                                    {contents.sourceName
                                        ? `Imagem: ${contents.sourceName}`
                                        : "Imagem ilustrativa"}
                                </figcaption>
                            </figure>
                        )}
                    </header>
                    <div
                        className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-8 prose-a:text-red-600 hover:prose-a:text-red-700 prose-img:rounded-xl prose-img:shadow-sm prose-blockquote:border-l-4 prose-blockquote:border-red-600 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal"
                        dangerouslySetInnerHTML={{
                        __html: contents.content,
                        }}
                    />
                    <div className="mt-5 py-5 gap-5 flex flex-row items-start">
                        <strong className="mt-6 text-red-600 uppercase">Tags: </strong>
                        <div className="py-5 gap-3 flex items-center flex-wrap">
                        {
                            contents.tags &&
                            (contents.tags ?? []).map(tag => (
                            <Link 
                            key={`tag-${tag.id}`}
                            className="px-5 py-2 text-xs hover:bg-primary hover:text-primary-foreground font-semibold text-center uppercase"
                            href={`/tag/${tag.slug}`}
                            >{tag.name}</Link>
                            ))
                        }
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <p>
                        Esta matéria ainda não possui conteúdo completo disponível.
                    </p>

                    <p>
                        Nosso agregador exibe automaticamente as principais notícias dos
                        maiores portais brasileiros, preservando a fonte original da
                        publicação.
                    </p>

                    {contents.sourceUrl && (
                        <p>
                        <Link
                            href={contents.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Clique aqui para acessar a publicação original.
                        </Link>
                        </p>
                    )}
                </>
            )}
        </article>
    )
}

function formatDate(date: Date | null) { 
  return date 
  ? new Intl.DateTimeFormat("pt-BR", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  }).format(new Date(date)) 
  : ""; 
}
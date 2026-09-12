import Image from "next/image";
import Link from "next/link";
import type { ThemeLayoutProps } from "@/lib/plugins/themes";
import { getPageContent } from "../data";
export default async function PageLayout({params}: ThemeLayoutProps) { 
    const { slug } = (await params) ?? {};
    const contents = await getPageContent(slug)
    
    if (!contents) return <main>Nenhuma página publicada ainda.</main>;
    return (
        <article>
            {contents.content ? (
                <>
                    <div
                        className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-8 prose-a:text-red-600 hover:prose-a:text-red-700 prose-img:rounded-xl prose-img:shadow-sm prose-blockquote:border-l-4 prose-blockquote:border-red-600 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal"
                        dangerouslySetInnerHTML={{
                        __html: contents.content,
                        }}
                    />
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
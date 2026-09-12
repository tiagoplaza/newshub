import type { ThemeLayoutProps } from "@/lib/plugins/themes";
import { getPageContent } from "../data";
export default async function PageLayout({params}: ThemeLayoutProps) { 
    console.log(await params)
    const { slug } = (await params) ?? {};
    const contents = await getPageContent(slug)
    console.log("contents", contents)
    if (!contents || !contents.length) return <main>Nenhuma página publicada ainda.</main>;
}

import type { Metadata } from "next";
import "./tokens.css";
import { AdCashHeadScripts } from "../../plugins/adcash/scripts";

export const metadata: Metadata = {
  title: "CMS",
  description: "CMS estilo WordPress construído em Next.js",
  alternates: {
    canonical: process.env.SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <AdCashHeadScripts />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

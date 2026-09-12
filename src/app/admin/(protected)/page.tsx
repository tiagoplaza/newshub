import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [posts, published, pages, users, comments] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.page.count(),
    prisma.user.count(),
    prisma.comment.count({ where: { approved: false } }),
  ]);

  const cards = [
    { label: "Posts", value: posts, hint: `${published} publicados`, href: "/admin/posts" },
    { label: "Páginas", value: pages, href: "/admin/pages" },
    { label: "Usuários", value: users, href: "/admin/users" },
    { label: "Comentários pendentes", value: comments, href: "/admin/posts" },
  ];

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Painel</h1>
          <p className="admin-subtitle">Visão geral do conteúdo do site</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card card-pad" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {card.label}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 600, margin: "8px 0 2px" }}>{card.value}</div>
            {card.hint && <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{card.hint}</div>}
          </Link>
        ))}
      </div>
    </>
  );
}

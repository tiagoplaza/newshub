"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusStamp } from "@/components/admin/StatusStamp";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface PageRow {
  id: string;
  title: string;
  status: string;
  parentId: string | null;
  author: { name: string };
}

export default function PagesListPage() {
  const [pages, setPages] = useState<PageRow[] | null>(null);

  async function load() {
    const res = await fetch("/api/pages");
    const data = await res.json();
    setPages(data.pages ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Páginas</h1>
          <p className="admin-subtitle">Conteúdo estático do site: institucional, contato, etc.</p>
        </div>
        <Link href="/admin/pages/new" className="btn btn-primary">+ Nova página</Link>
      </header>

      <div className="card">
        {pages === null ? (
          <div className="empty-state">Carregando…</div>
        ) : pages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">Nenhuma página ainda</div>
            Crie páginas como "Sobre" ou "Contato".
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Autor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <Link href={`/admin/pages/${page.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      {page.parentId && <span style={{ color: "var(--ink-500)" }}>— </span>}
                      {page.title}
                    </Link>
                  </td>
                  <td><StatusStamp status={page.status} /></td>
                  <td>{page.author?.name}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <Link href={`/admin/pages/${page.id}`} className="btn btn-sm">Editar</Link>
                      <DeleteButton onConfirm={() => handleDelete(page.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

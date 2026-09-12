"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusStamp } from "@/components/admin/StatusStamp";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface PostRow {
  id: string;
  title: string;
  status: string;
  author: { name: string };
  categories: { category: { name: string } }[];
  createdAt: string;
}

export default function PostsListPage() {
  const [posts, setPosts] = useState<PostRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/posts?pageSize=50");
    if (!res.ok) {
      setError("Não foi possível carregar os posts.");
      return;
    }
    const data = await res.json();
    setPosts(data.posts);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Posts</h1>
          <p className="admin-subtitle">Matérias, artigos e conteúdo do blog</p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary">+ Novo post</Link>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {posts === null ? (
          <div className="empty-state">Carregando…</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">Nenhum post ainda</div>
            Crie o primeiro post para começar a publicar.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Categoria</th>
                <th>Autor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/admin/posts/${post.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                      {post.title}
                    </Link>
                  </td>
                  <td><StatusStamp status={post.status} /></td>
                  <td>{post.categories.map((c) => c.category.name).join(", ") || "—"}</td>
                  <td>{post.author?.name}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <Link href={`/admin/posts/${post.id}`} className="btn btn-sm">Editar</Link>
                      <DeleteButton onConfirm={() => handleDelete(post.id)} />
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

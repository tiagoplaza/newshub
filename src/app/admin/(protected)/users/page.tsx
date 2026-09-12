"use client";

import { useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface Role { id: string; name: string; }
interface UserRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
  role: Role;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleId: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/users");
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    load();
    fetch("/api/roles").then((r) => r.json()).then((data) => setRoles(data.roles ?? []));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível criar o usuário.");
      return;
    }
    setForm({ name: "", email: "", password: "", roleId: "" });
    load();
  }

  async function handleRoleChange(id: string, roleId: string) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
    load();
  }

  async function handleToggleActive(id: string, active: boolean) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Usuários</h1>
          <p className="admin-subtitle">Contas e papéis de acesso ao painel</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        <div className="card">
          {users === null ? (
            <div className="empty-state">Carregando…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Ativo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: "var(--ink-500)" }}>{u.email}</td>
                    <td>
                      <select value={u.role.id} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => handleToggleActive(u.id, u.active)}>
                        {u.active ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <DeleteButton onConfirm={() => handleDelete(u.id)} confirmText={`Excluir o usuário ${u.name}?`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form onSubmit={handleCreate} className="card card-pad">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Novo usuário</div>
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label htmlFor="u-name">Nome</label>
            <input id="u-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="u-email">E-mail</label>
            <input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="u-password">Senha</label>
            <input id="u-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
          <div className="field">
            <label htmlFor="u-role">Papel</label>
            <select id="u-role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} required>
              <option value="">Selecione…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Criar usuário
          </button>
        </form>
      </div>
    </>
  );
}

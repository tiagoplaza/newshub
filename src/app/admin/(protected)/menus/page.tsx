"use client";

import { useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface MenuItemNode {
  id: string;
  label: string;
  url: string | null;
  parentId: string | null;
  children: MenuItemNode[];
}
interface MenuNode {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  items: MenuItemNode[];
}

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuNode[] | null>(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuLocation, setNewMenuLocation] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/menus");
    const data = await res.json();
    setMenus(data.menus ?? []);
    setSelectedMenuId((current) => current ?? data.menus?.[0]?.id ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateMenu(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newMenuName, slug: slugify(newMenuName), location: newMenuLocation || undefined }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível criar o menu.");
      return;
    }
    setNewMenuName("");
    setNewMenuLocation("");
    load();
  }

  async function handleLocationChange(menuId: string, location: string) {
    await fetch(`/api/menus/${menuId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: location || null }),
    });
    load();
  }

  const selectedMenu = menus?.find((m) => m.id === selectedMenuId) ?? null;

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Menus</h1>
          <p className="admin-subtitle">Estrutura de navegação do site, com submenus</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>
        <div className="card card-pad">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Seus menus</div>
          {menus === null ? (
            <div className="field-hint">Carregando…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              {menus.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMenuId(m.id)}
                  className="btn btn-sm"
                  style={{ justifyContent: "space-between", background: m.id === selectedMenuId ? "var(--moss-100)" : undefined }}
                >
                  <span>{m.name}</span>
                  {m.location && <span style={{ fontSize: 10, color: "var(--ink-500)" }}>{m.location === "HEADER" ? "cabeçalho" : "rodapé"}</span>}
                </button>
              ))}
              {menus.length === 0 && <div className="field-hint">Nenhum menu ainda.</div>}
            </div>
          )}

          <form onSubmit={handleCreateMenu}>
            {error && <div className="error-banner">{error}</div>}
            <div className="field">
              <label htmlFor="menu-name">Novo menu</label>
              <input id="menu-name" type="text" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} placeholder="ex: Menu principal" required />
            </div>
            <div className="field">
              <label htmlFor="menu-location">Aparece em</label>
              <select id="menu-location" value={newMenuLocation} onChange={(e) => setNewMenuLocation(e.target.value)}>
                <option value="">Nenhum lugar (só interno)</option>
                <option value="HEADER">Cabeçalho do site</option>
                <option value="FOOTER">Rodapé do site</option>
              </select>
              <div className="field-hint">Só menus marcados aqui aparecem de fato no site público.</div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Criar menu</button>
          </form>
        </div>

        <div className="card card-pad">
          {!selectedMenu ? (
            <div className="empty-state">
              <div className="empty-state-title">Nenhum menu selecionado</div>
              Crie um menu ao lado para começar a adicionar itens.
            </div>
          ) : (
            <MenuEditor menu={selectedMenu} onChange={load} onLocationChange={(loc) => handleLocationChange(selectedMenu.id, loc)} />
          )}
        </div>
      </div>
    </>
  );
}

function MenuEditor({ menu, onChange, onLocationChange }: { menu: MenuNode; onChange: () => void; onLocationChange: (location: string) => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const flatItems = flatten(menu.items);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/menus/${menu.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, url: url || undefined, parentId: parentId || null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível adicionar o item.");
      return;
    }
    setLabel("");
    setUrl("");
    setParentId("");
    onChange();
  }

  async function handleDeleteItem(itemId: string) {
    const res = await fetch(`/api/menus/${menu.id}/items/${itemId}`, { method: "DELETE" });
    if (res.ok) onChange();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{menu.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="menu-editor-location" style={{ fontSize: 12.5, color: "var(--ink-500)" }}>Aparece em</label>
          <select id="menu-editor-location" value={menu.location ?? ""} onChange={(e) => onLocationChange(e.target.value)}>
            <option value="">Nenhum lugar</option>
            <option value="HEADER">Cabeçalho</option>
            <option value="FOOTER">Rodapé</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        {menu.items.length === 0 ? (
          <div className="field-hint">Nenhum item neste menu ainda.</div>
        ) : (
          <MenuItemList items={menu.items} onDelete={handleDeleteItem} depth={0} />
        )}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "0 0 20px" }} />

      <form onSubmit={handleAddItem} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
        {error && <div className="error-banner" style={{ gridColumn: "1 / -1" }}>{error}</div>}
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="item-label">Rótulo</label>
          <input id="item-label" type="text" value={label} onChange={(e) => setLabel(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="item-url">Link</label>
          <input id="item-url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/sobre" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="item-parent">É submenu de</label>
          <select id="item-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Item de nível 1</option>
            {flatItems.map((it) => (
              <option key={it.id} value={it.id}>{it.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">+ Item</button>
      </form>
    </>
  );
}

function MenuItemList({ items, onDelete, depth }: { items: MenuItemNode[]; onDelete: (id: string) => void; depth: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item) => (
        <div key={item.id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              marginLeft: depth * 22,
              background: depth > 0 ? "var(--paper)" : "var(--paper-card)",
              border: "1px solid var(--line)",
              borderRadius: 6,
            }}
          >
            <div>
              <strong>{item.label}</strong>
              {item.url && <span style={{ color: "var(--ink-500)", marginLeft: 8, fontSize: 12.5 }}>{item.url}</span>}
            </div>
            <DeleteButton onConfirm={() => onDelete(item.id)} confirmText="Excluir este item (e seus submenus)?" />
          </div>
          {item.children.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <MenuItemList items={item.children} onDelete={onDelete} depth={depth + 1} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function flatten(items: MenuItemNode[]): MenuItemNode[] {
  return items.flatMap((item) => [item, ...flatten(item.children)]);
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

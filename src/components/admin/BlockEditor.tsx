"use client";

import { useEffect, useRef, useState } from "react";
import { MediaPicker } from "./MediaPicker";

/**
 * Editor de blocos sem dependência externa (sem Gutenberg/TipTap/Slate).
 * Cada bloco é uma unidade estruturada (parágrafo, título, lista, citação,
 * imagem ou HTML bruto como escape hatch) que o usuário adiciona, reordena
 * (mover para cima/baixo) e edita individualmente.
 *
 * Contrato externo idêntico ao do RichTextEditor que substitui: recebe
 * `value` (uma string de HTML) e chama `onChange(html)` — por isso nada no
 * resto do app precisa mudar (renderização do post público, plugins como
 * `reading-time`/`shortcodes`/`auto-excerpt` continuam operando sobre HTML
 * normalmente).
 *
 * Formatação inline (negrito/itálico/link) dentro de cada bloco de texto
 * (parágrafo/título/citação) tem sua própria mini barra de ferramentas
 * (componente EditableHtml, prop `toolbar`) — os botões usam
 * onMouseDown+preventDefault pra não perder a seleção de texto ao clicar.
 */

type BlockType = "paragraph" | "heading2" | "heading3" | "quote" | "list" | "orderedList" | "image" | "html";

interface Block {
  id: string;
  type: BlockType;
  html?: string; // paragraph, heading2, heading3, quote — innerHTML do bloco
  items?: string[]; // list, orderedList — innerHTML de cada <li>
  imageUrl?: string;
  imageAlt?: string;
  rawHtml?: string; // bloco "html" — passthrough usado tanto como escape hatch quanto
  // para preservar, sem perda, qualquer marcação que o parser não reconheça
}

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `b${Date.now()}${idCounter}`;
}

export function BlockEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseHtmlToBlocks(value));
  const [pickerForBlock, setPickerForBlock] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const isFirstRender = useRef(true);
  const lastEmitted = useRef(value);

  // Só re-parseia quando o valor muda por fora (ex: carregou um post
  // existente) — não a cada emissão nossa própria, senão perderíamos o
  // foco/cursor a cada tecla.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (value !== lastEmitted.current) {
      setBlocks(parseHtmlToBlocks(value));
    }
  }, [value]);

  function emit(next: Block[]) {
    setBlocks(next);
    const html = blocksToHtml(next);
    lastEmitted.current = html;
    onChange(html);
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    emit(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeBlock(id: string) {
    emit(blocks.filter((b) => b.id !== id));
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const index = blocks.findIndex((b) => b.id === id);
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  }

  function reorderByDrag(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = blocks.findIndex((b) => b.id === dragId);
    const to = blocks.findIndex((b) => b.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    emit(next);
  }

  function addBlock(type: BlockType) {
    const base: Block = { id: newId(), type };
    if (type === "list" || type === "orderedList") base.items = ["Item da lista"];
    if (type === "image") { base.imageUrl = ""; base.imageAlt = ""; }
    if (type === "html") base.rawHtml = "<!-- HTML personalizado -->";
    if (type === "paragraph" || type === "heading2" || type === "heading3" || type === "quote") base.html = "";
    emit([...blocks, base]);
  }

  return (
    <div style={{ border: "1px solid var(--line-strong)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 6, padding: 8, background: "var(--paper)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <AddButton label="¶ Parágrafo" onClick={() => addBlock("paragraph")} />
        <AddButton label="H2" onClick={() => addBlock("heading2")} />
        <AddButton label="H3" onClick={() => addBlock("heading3")} />
        <AddButton label="• Lista" onClick={() => addBlock("list")} />
        <AddButton label="1. Lista" onClick={() => addBlock("orderedList")} />
        <AddButton label="❝ Citação" onClick={() => addBlock("quote")} />
        <AddButton label="🖼 Imagem" onClick={() => addBlock("image")} />
        <AddButton label="</> HTML" onClick={() => addBlock("html")} />
      </div>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {blocks.length === 0 && (
          <div className="field-hint">Nenhum bloco ainda — adicione um pela barra acima.</div>
        )}
        {blocks.map((block, i) => (
          <BlockRow
            key={block.id}
            block={block}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
            isDragging={dragId === block.id}
            onChange={(patch) => updateBlock(block.id, patch)}
            onRemove={() => removeBlock(block.id)}
            onMoveUp={() => moveBlock(block.id, -1)}
            onMoveDown={() => moveBlock(block.id, 1)}
            onOpenPicker={() => setPickerForBlock(block.id)}
            onDragStart={() => setDragId(block.id)}
            onDragEnd={() => setDragId(null)}
            onDragOverDrop={() => reorderByDrag(block.id)}
          />
        ))}
      </div>

      {pickerForBlock && (
        <MediaPicker
          onSelect={(url) => {
            updateBlock(pickerForBlock, { imageUrl: url });
            setPickerForBlock(null);
          }}
          onClose={() => setPickerForBlock(null)}
        />
      )}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-sm">
      + {label}
    </button>
  );
}

function BlockRow({
  block,
  isFirst,
  isLast,
  isDragging,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onOpenPicker,
  onDragStart,
  onDragEnd,
  onDragOverDrop,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenPicker: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverDrop: () => void;
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDragOverDrop();
      }}
      style={{
        border: "1px solid var(--line)",
        borderRadius: 6,
        padding: 12,
        background: "var(--paper-card)",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Arrastar para reordenar"
            style={{ cursor: "grab", color: "var(--ink-500)", fontSize: 14, userSelect: "none" }}
          >
            ⠿
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-500)" }}>
            {BLOCK_LABELS[block.type]}
          </span>
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" className="btn btn-sm" disabled={isFirst} onClick={onMoveUp} title="Mover para cima">↑</button>
          <button type="button" className="btn btn-sm" disabled={isLast} onClick={onMoveDown} title="Mover para baixo">↓</button>
          <button type="button" className="btn btn-sm btn-danger" onClick={onRemove} title="Remover bloco">×</button>
        </div>
      </div>

      <BlockBody block={block} onChange={onChange} onOpenPicker={onOpenPicker} />
    </div>
  );
}

const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: "Parágrafo",
  heading2: "Título 2",
  heading3: "Título 3",
  quote: "Citação",
  list: "Lista",
  orderedList: "Lista numerada",
  image: "Imagem",
  html: "HTML",
};

function BlockBody({ block, onChange, onOpenPicker }: { block: Block; onChange: (patch: Partial<Block>) => void; onOpenPicker: () => void }) {
  if (block.type === "paragraph" || block.type === "heading2" || block.type === "heading3" || block.type === "quote") {
    const fontSize = block.type === "heading2" ? 20 : block.type === "heading3" ? 17 : 14.5;
    const fontWeight = block.type === "heading2" || block.type === "heading3" ? 600 : 400;
    return (
      <EditableHtml
        html={block.html ?? ""}
        onChange={(html) => onChange({ html })}
        style={{ fontSize, fontWeight, fontStyle: block.type === "quote" ? "italic" : "normal" }}
        placeholder={block.type === "quote" ? "Texto da citação…" : "Digite aqui…"}
        toolbar
      />
    );
  }

  if (block.type === "list" || block.type === "orderedList") {
    const items = block.items ?? [];
    const Tag = block.type === "list" ? "ul" : "ol";
    return (
      <div>
        <Tag style={{ margin: 0, paddingLeft: 20 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 6, listStyle: "inherit" }}>
              <EditableHtml
                html={item}
                onChange={(html) => {
                  const next = [...items];
                  next[idx] = html;
                  onChange({ items: next });
                }}
                style={{ flex: 1, fontSize: 14.5 }}
                placeholder="Item da lista"
              />
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => onChange({ items: items.filter((_, i) => i !== idx) })}
                title="Remover item"
              >
                ×
              </button>
            </li>
          ))}
        </Tag>
        <button type="button" className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => onChange({ items: [...items, ""] })}>
          + Item
        </button>
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div>
        {block.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.imageUrl} alt={block.imageAlt ?? ""} style={{ maxWidth: "100%", borderRadius: 6, marginBottom: 8 }} />
        ) : (
          <div className="field-hint" style={{ marginBottom: 8 }}>Nenhuma imagem escolhida ainda.</div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button type="button" className="btn btn-sm" onClick={onOpenPicker}>
            {block.imageUrl ? "Trocar imagem" : "Escolher imagem"}
          </button>
        </div>
        <input
          type="text"
          placeholder="Texto alternativo (alt)"
          value={block.imageAlt ?? ""}
          onChange={(e) => onChange({ imageAlt: e.target.value })}
          style={{ width: "100%", padding: "6px 9px", border: "1px solid var(--line-strong)", borderRadius: 6, fontSize: 13 }}
        />
      </div>
    );
  }

  // block.type === "html"
  return (
    <textarea
      value={block.rawHtml ?? ""}
      onChange={(e) => onChange({ rawHtml: e.target.value })}
      style={{ width: "100%", minHeight: 100, fontFamily: "var(--font-mono)", fontSize: 12.5, border: "1px solid var(--line-strong)", borderRadius: 6, padding: 8 }}
    />
  );
}

/** contentEditable de uma linha/bloco só, preservando innerHTML (permite negrito/itálico/link herdados do conteúdo original ou digitados via atalho do navegador). Com `toolbar`, mostra botões de negrito/itálico/link acima — usa onMouseDown+preventDefault pra não perder a seleção de texto ao clicar neles. */
function EditableHtml({ html, onChange, style, placeholder, toolbar }: { html: string; onChange: (html: string) => void; style?: React.CSSProperties; placeholder?: string; toolbar?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html && document.activeElement !== ref.current) {
      ref.current.innerHTML = html;
    }
  }, [html]);

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  }

  function insertLink() {
    const url = window.prompt("URL do link:");
    if (url) exec("createLink", url);
  }

  return (
    <div>
      {toolbar && (
        <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
          <button type="button" className="btn btn-sm" style={{ padding: "2px 8px", fontWeight: 700 }} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} title="Negrito">B</button>
          <button type="button" className="btn btn-sm" style={{ padding: "2px 8px", fontStyle: "italic" }} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} title="Itálico">I</button>
          <button type="button" className="btn btn-sm" style={{ padding: "2px 8px" }} onMouseDown={(e) => e.preventDefault()} onClick={insertLink} title="Link">🔗</button>
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onBlur={() => onChange(ref.current?.innerHTML ?? "")}
        data-placeholder={placeholder}
        className="block-editable"
        style={{ outline: "none", lineHeight: 1.6, minHeight: 24, ...style }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversão HTML <-> blocos
// ---------------------------------------------------------------------------

function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "paragraph":
          return `<p>${b.html ?? ""}</p>`;
        case "heading2":
          return `<h2>${b.html ?? ""}</h2>`;
        case "heading3":
          return `<h3>${b.html ?? ""}</h3>`;
        case "quote":
          return `<blockquote>${b.html ?? ""}</blockquote>`;
        case "list":
          return `<ul>${(b.items ?? []).map((i) => `<li>${i}</li>`).join("")}</ul>`;
        case "orderedList":
          return `<ol>${(b.items ?? []).map((i) => `<li>${i}</li>`).join("")}</ol>`;
        case "image":
          return b.imageUrl ? `<img src="${escapeAttr(b.imageUrl)}" alt="${escapeAttr(b.imageAlt ?? "")}" />` : "";
        case "html":
          return b.rawHtml ?? "";
        default:
          return "";
      }
    })
    .join("\n");
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Parser best-effort: percorre os elementos de topo do HTML salvo e mapeia
 * cada um para um tipo de bloco conhecido. Qualquer tag que não reconheça
 * (div, section, table, iframe embed, etc.) vira um bloco "html" com o
 * outerHTML original preservado — não há perda de conteúdo, só perda de
 * "estrutura editável" pra marcação incomum, que ainda pode ser editada
 * como HTML bruto naquele bloco.
 */
function parseHtmlToBlocks(html: string): Block[] {
  if (typeof window === "undefined" || !html.trim()) {
    return html.trim() ? [{ id: newId(), type: "html", rawHtml: html }] : [];
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: Block[] = [];

  for (const el of Array.from(doc.body.children)) {
    const tag = el.tagName.toLowerCase();

    if (tag === "p") {
      blocks.push({ id: newId(), type: "paragraph", html: el.innerHTML });
    } else if (tag === "h2") {
      blocks.push({ id: newId(), type: "heading2", html: el.innerHTML });
    } else if (tag === "h3") {
      blocks.push({ id: newId(), type: "heading3", html: el.innerHTML });
    } else if (tag === "blockquote") {
      blocks.push({ id: newId(), type: "quote", html: el.innerHTML });
    } else if (tag === "ul") {
      blocks.push({ id: newId(), type: "list", items: Array.from(el.children).map((li) => li.innerHTML) });
    } else if (tag === "ol") {
      blocks.push({ id: newId(), type: "orderedList", items: Array.from(el.children).map((li) => li.innerHTML) });
    } else if (tag === "img") {
      blocks.push({ id: newId(), type: "image", imageUrl: el.getAttribute("src") ?? "", imageAlt: el.getAttribute("alt") ?? "" });
    } else {
      blocks.push({ id: newId(), type: "html", rawHtml: el.outerHTML });
    }
  }

  return blocks;
}

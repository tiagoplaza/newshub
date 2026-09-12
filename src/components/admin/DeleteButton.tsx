"use client";

export function DeleteButton({ onConfirm, label = "Excluir", confirmText = "Excluir este item? Essa ação não pode ser desfeita." }: { onConfirm: () => void | Promise<void>; label?: string; confirmText?: string }) {
  return (
    <button
      type="button"
      className="btn btn-sm btn-danger"
      onClick={() => {
        if (window.confirm(confirmText)) onConfirm();
      }}
    >
      {label}
    </button>
  );
}

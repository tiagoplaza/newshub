const LABELS: Record<string, string> = {
  PUBLISHED: "Publicado",
  DRAFT: "Rascunho",
  PENDING_REVIEW: "Em revisão",
  SCHEDULED: "Agendado",
  ARCHIVED: "Arquivado",
  TRASHED: "Lixeira",
};

export function StatusStamp({ status }: { status: string }) {
  return <span className={`stamp stamp-${status.toLowerCase()}`}>{LABELS[status] ?? status}</span>;
}

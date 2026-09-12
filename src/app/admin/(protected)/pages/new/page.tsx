import { PageForm } from "@/components/admin/PageForm";

export default function NewPagePage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Nova página</h1>
          <p className="admin-subtitle">Conteúdo estático, ex: Sobre, Contato</p>
        </div>
      </header>
      <PageForm />
    </>
  );
}

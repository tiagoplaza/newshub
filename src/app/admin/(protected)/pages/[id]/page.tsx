import { PageForm } from "@/components/admin/PageForm";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Editar página</h1>
        </div>
      </header>
      <PageForm pageId={id} />
    </>
  );
}

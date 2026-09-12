import { PostForm } from "@/components/admin/PostForm";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Editar post</h1>
          <p className="admin-subtitle">Alterações geram uma nova revisão automaticamente</p>
        </div>
      </header>
      <PostForm postId={id} />
    </>
  );
}

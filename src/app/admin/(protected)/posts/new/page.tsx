import { PostForm } from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Novo post</h1>
          <p className="admin-subtitle">Escreva e publique uma nova matéria</p>
        </div>
      </header>
      <PostForm />
    </>
  );
}

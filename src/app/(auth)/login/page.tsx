import { LoginForm } from "../../../features/auth/LoginForm";
import { Card } from "../../../components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-6 px-5 py-10 lg:grid-cols-[minmax(320px,420px)_minmax(280px,1fr)] lg:px-8">
      <LoginForm />
      <Card>
        <div className="grid gap-5">
          <div className="border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase text-stone-500">Ambiente</p>
            <strong className="mt-2 block text-xl text-stone-900">Controle de acesso</strong>
          </div>
          <div className="border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase text-stone-500">Sessão</p>
            <strong className="mt-2 block text-xl text-stone-900">Refresh rotativo</strong>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">Papéis</p>
            <strong className="mt-2 block text-xl text-stone-900">Admin, analyst, user</strong>
          </div>
        </div>
      </Card>
    </main>
  );
}

import { LinkButton } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export default function SessionExpiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <Card className="max-w-lg text-center">
        <p className="text-xs font-semibold uppercase text-moss">Sessão</p>
        <h1 className="text-3xl font-semibold text-stone-900">Sessão expirada</h1>
        <p className="text-stone-600">Entre novamente para continuar.</p>
        <LinkButton href="/login" className="mt-2">
          Entrar
        </LinkButton>
      </Card>
    </main>
  );
}

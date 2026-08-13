import { LinkButton } from "../../../components/atoms/button";
import { Card } from "../../../components/atoms/card";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <Card className="max-w-lg text-center">
        <p className="text-xs font-semibold uppercase text-moss">403</p>
        <h1 className="text-3xl font-semibold text-stone-900">Acesso não autorizado</h1>
        <p className="text-stone-600">Sua sessão está ativa, mas este recurso não está liberado.</p>
        <LinkButton href="/dashboard" className="mt-2">
          Voltar
        </LinkButton>
      </Card>
    </main>
  );
}

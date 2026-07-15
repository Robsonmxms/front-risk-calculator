import { Button, Card } from "flowbite-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <Card className="max-w-lg border-gray-200 bg-white text-center shadow-sm">
        <p className="text-xs font-semibold uppercase text-teal-700">403</p>
        <h1 className="text-3xl font-semibold text-stone-900">Acesso nao autorizado</h1>
        <p className="text-stone-600">Sua sessao esta ativa, mas este recurso nao esta liberado.</p>
        <Button href="/dashboard" color="teal">
          Voltar
        </Button>
      </Card>
    </main>
  );
}

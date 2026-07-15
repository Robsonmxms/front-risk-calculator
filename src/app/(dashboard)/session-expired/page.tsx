import { Button, Card } from "flowbite-react";

export default function SessionExpiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <Card className="max-w-lg border-gray-200 bg-white text-center shadow-sm">
        <p className="text-xs font-semibold uppercase text-teal-700">Sessao</p>
        <h1 className="text-3xl font-semibold text-stone-900">Sessao expirada</h1>
        <p className="text-stone-600">Entre novamente para continuar.</p>
        <Button href="/login" color="teal">
          Entrar
        </Button>
      </Card>
    </main>
  );
}

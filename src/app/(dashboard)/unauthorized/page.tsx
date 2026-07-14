import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="state-screen">
      <p className="eyebrow">403</p>
      <h1>Acesso nao autorizado</h1>
      <p className="muted">Sua sessao esta ativa, mas este recurso nao esta liberado.</p>
      <Link className="button button--primary" href="/dashboard">
        Voltar
      </Link>
    </main>
  );
}

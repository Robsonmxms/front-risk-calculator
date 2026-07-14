import Link from "next/link";

export default function SessionExpiredPage() {
  return (
    <main className="state-screen">
      <p className="eyebrow">Sessao</p>
      <h1>Sessao expirada</h1>
      <p className="muted">Entre novamente para continuar.</p>
      <Link className="button button--primary" href="/login">
        Entrar
      </Link>
    </main>
  );
}

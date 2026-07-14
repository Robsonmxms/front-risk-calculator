import { LoginForm } from "../../../features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <LoginForm />
      <section className="auth-aside" aria-label="Resumo operacional">
        <div>
          <p className="metric-label">Ambiente</p>
          <strong>Controle de acesso</strong>
        </div>
        <div>
          <p className="metric-label">Sessao</p>
          <strong>Refresh rotativo</strong>
        </div>
        <div>
          <p className="metric-label">Papeis</p>
          <strong>Admin, analyst, user</strong>
        </div>
      </section>
    </main>
  );
}

import { LoginForm } from "../../../features/auth/LoginForm";
import { Card } from "../../../components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl content-center items-center gap-5 px-5 py-6 lg:grid-cols-[minmax(320px,420px)_minmax(280px,1fr)] lg:px-8">
      <LoginForm />
      <Card className="w-full max-w-md lg:max-w-none">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <TrustSignal
            label="Sessão"
            value="Tokens protegidos"
            detail="Renovação controlada pela API da plataforma."
          />
          <TrustSignal
            label="Dados"
            value="Mercado via backend"
            detail="O navegador não consulta provedores externos diretamente."
          />
          <TrustSignal
            label="Ambiente"
            value="Acesso por perfil"
            detail="Rotas visíveis seguem escritório, conta e papel da sessão."
          />
        </div>
      </Card>
    </main>
  );
}

function TrustSignal({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-b border-border pb-4 last:border-b-0 last:pb-0 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 sm:last:border-r-0 sm:last:pr-0 lg:border-b lg:border-r-0 lg:pb-4 lg:pr-0 lg:last:border-b-0 lg:last:pb-0">
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
      <strong className="mt-1 block text-base font-semibold text-stone-900">{value}</strong>
      <p className="mt-1 hidden text-sm text-stone-600 sm:block">{detail}</p>
    </div>
  );
}

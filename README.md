# front-risk-calculator

Interface Next.js do Risk Calculator para investidores, clientes e equipes de escritórios. Consome
exclusivamente os contratos do backend e cobre sessão, portfólios, analytics, operações de
escritório, compliance e entrega de relatórios.

## Stack e contratos

- Next.js 16 App Router, React 19 e TypeScript;
- Tailwind CSS com tokens e componentes project-owned do shadcn/ui sobre Radix UI;
- `fetch` por um cliente central com refresh de sessão único após `401`;
- Vitest, Testing Library e jsdom.

O `accessToken` e o ator ficam no `sessionStorage`; o refresh token permanece apenas em memória.
RBAC da interface melhora a navegação, mas a segurança é sempre decidida pelo backend. O frontend
não chama Yahoo/Open ER API nem calcula métricas financeiras.

Datas de calendário recebidas como `YYYY-MM-DD` são exibidas em `dd/mm/yyyy` sem conversão de
timezone. Instantes RFC 3339 são mostrados em português, com relógio de 24 horas e timezone
`America/Fortaleza`. A interface mostra provider, horário da fonte, horário da consulta, freshness
e origem live/fallback/determinística para conversões.

## Rotas

- `/` redireciona para `/dashboard`;
- `/login`, `/session-expired` e `/unauthorized` tratam autenticação e sessão;
- `/dashboard` apresenta contas, portfólios, FX, criação manual e importação assíncrona por XLSX;
- `/admin` lista usuários em modo somente leitura para administradores;
- `/dashboard/portfolios/[portfolioId]` cobre ledger, posições, analytics, relatórios e alertas;
- `/dashboard/analytics-diagnostics` cobre diagnósticos e jobs analíticos;
- `/dashboard/clients` e `/dashboard/clients/[clientId]` cobrem clientes e grupos;
- `/dashboard/workbench` cobre carteira de trabalho e revisões;
- `/dashboard/offices/[officeId]/settings` e `/operations` cobrem gestão e operação do escritório;
- `/dashboard/compliance` cobre auditoria e supervisão;
- `/dashboard/report-delivery` e `/dashboard/client-portal` cobrem aprovação, entrega e consumo de
  pacotes de relatórios.

Os clientes em `src/features` correspondem aos grupos de API de auth, office, operational charts,
client, portfolio/market/analytics/report/alert/notification, workbench, compliance, delivery e
analytics diagnostics.

No dashboard, `Baixar modelo XLSX` obtém o template versionado do backend. O painel de importação
envia o arquivo com idempotência, restaura o histórico por conta, acompanha fila/validação/criação
por polling com atualização por evento quando disponível e permite baixar a planilha de erros sem
expor chaves de storage.

## Features ativas ainda não implementadas

- A feature raiz `1 - centralized-secrets-runtime-configuration` pertence ao backend. Nenhum
  segredo deve chegar ao frontend ou ser publicado por `NEXT_PUBLIC_*`; o navegador recebe somente
  configuração explicitamente pública.
- A feature raiz `2 - hierarchical-user-management` adicionará listas separadas por classe e os
  fluxos autorizados de criação/edição na hierarquia `admin > analyst > user`. Hoje não existem
  mutações de usuário nem telas de gestão para analistas.

## Execução local

```bash
nvm use
corepack enable
yarn install
yarn dev
```

Configure `NEXT_PUBLIC_API_BASE_URL` (padrão local
`http://localhost:8000/api/v1`). Para QA manual reproduzível, inicie o backend com
`yarn dev:seeded`; essa fonte é explicitamente identificada como determinística nas superfícies de
mercado. O boot normal do backend permanece vazio.

## Qualidade

```bash
yarn check:runtime-data
yarn check:public-config
yarn architecture:check
yarn lint
yarn typecheck
yarn test
yarn test:risk
yarn test:coverage
yarn build
```

`yarn architecture:check` valida dependências entre App Router, features, componentes atômicos e
fundamentos, além de ciclos e componentes declarados dentro de rotas. `yarn lint` inclui esse gate
e também verifica a formatação Prettier com largura de 100 caracteres. `yarn lint:fix`
aplica automaticamente as quebras de linha e demais ajustes mecânicos.

Vitest usa um worker e timeout uniforme de 20 segundos para reduzir flutuação sob carga.
`test:risk` protege páginas e contratos de data/sessão de maior risco. O gate de cobertura inclui
clientes de API, sessão, navegação, apresentação/date-time, gráficos compartilhados e realtime;
páginas completas continuam protegidas pelos testes de regressão, mas não entram no percentual
agregado do gate. Os mínimos desse escopo ampliado são 80% para statements/functions/lines e 60%
para branches.

## Estrutura

```text
src/
  app/              rotas e composição externa do App Router
  components/
    atoms/           primitivas shadcn/Radix
    molecules/       pequenas composições reutilizáveis
    organisms/       navegação, gráficos, estados e seções completas
    templates/       estrutura responsiva por slots
  features/         containers, estado, serviços e APIs públicas por domínio
  lib/              contratos neutros, HTTP, sessão, realtime e apresentação
tests/unit/          contratos, componentes, páginas e fluxos
```

Veja também [Atomic Design e inventário de duplicações](docs/architecture/atomic-design.md),
[prontidão AWS](docs/aws-frontend-readiness.md) e
[branch protection](docs/branch-protection.md). O contexto e as features ativas ficam somente em
`../.specs/` na raiz do workspace. Licença MIT em [LICENSE](LICENSE).

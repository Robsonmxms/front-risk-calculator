# front-risk-calculator

Frontend em Next.js + TypeScript do Risk Calculator. No estado atual, este projeto implementa o
fluxo de autenticacao, bootstrap de sessao, telas protegidas e uma interface inicial para
visualizacao de acesso do usuario e operacoes administrativas.

## Estado atual

O frontend ja possui telas funcionais e testes unitarios. O escopo implementado hoje e:

- redirecionamento da raiz para `/dashboard`;
- pagina de login em `/login`;
- bootstrap de sessao via `AuthProvider`;
- armazenamento do access token e do actor em `sessionStorage`;
- refresh token mantido apenas em memoria no browser;
- renovacao automatica de sessao quando a API responde `401`;
- pagina protegida de dashboard;
- pagina protegida de administracao;
- telas de sessao expirada e acesso nao autorizado.

## Stack atual

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 App Router |
| Linguagem | TypeScript |
| UI | React 19 |
| Estilo | CSS global do app |
| Cliente HTTP | `fetch` com wrapper proprio |
| Testes | Vitest + Testing Library + jsdom |
| Pacotes | Yarn 4.17.1 via `packageManager` |

## Rotas da interface

- `/` redireciona para `/dashboard`
- `/login`
- `/dashboard`
- `/admin`
- `/session-expired`
- `/unauthorized`

## Integracao com a API

Base URL padrao:

```text
http://localhost:8000/api/v1
```

Configuracao por ambiente:

- `NEXT_PUBLIC_API_BASE_URL`

Chamadas usadas no frontend atual:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`
- `GET /admin/users`

## Comportamento de sessao

- `accessToken` e actor sao gravados em `sessionStorage`;
- refresh token nao vai para `localStorage` nem `sessionStorage`;
- quando uma request recebe `401`, o cliente tenta `POST /auth/refresh` uma unica vez;
- se o refresh falhar, a sessao local e limpa e a aplicacao trata a sessao como expirada.

## Estrutura atual

```text
front-risk-calculator/
  src/
    app/
      (auth)/
      (dashboard)/
    components/
      layout/
    features/
      auth/
    lib/
      api/
  tests/
    unit/
```

## Desenvolvimento local

Use Node e Yarn nas versoes do projeto:

```bash
nvm use
corepack enable
yarn install
yarn dev
```

Use `yarn` para instalar dependencias e executar scripts; o projeto declara `packageManager`
como `yarn@4.17.1` e usa `nodeLinker: node-modules`.

Comandos uteis:

```bash
yarn test
yarn test:coverage
yarn typecheck
yarn lint
yarn check:public-config
```

`yarn test:coverage` usa Vitest com provider `v8` e gate minimo de 80% para statements,
branches, functions e lines no escopo critico de contrato do frontend: cliente HTTP, clientes de
API em `src/features`, armazenamento de sessao e navegacao autenticada. As paginas e componentes
maiores continuam cobertos por `yarn test`; eles nao entram no limiar de coverage ate existir uma
suite E2E/visual dedicada.

O alvo AWS atual e container Node com Next.js standalone output. Detalhes de hosting,
`NEXT_PUBLIC_API_BASE_URL`, promocao de ambiente e limites de performance estao em
[docs/aws-frontend-readiness.md](docs/aws-frontend-readiness.md).
Checks obrigatorios sugeridos para branch protection estao em
[docs/branch-protection.md](docs/branch-protection.md).

Docker:

```bash
docker build --target dev -t front-risk-calculator:dev .
docker run --rm -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1 front-risk-calculator:dev
```

Compose do projeto:

```bash
docker compose up --build
```

## Testes

Os testes unitarios atuais validam fluxos de sessao, telas protegidas e contratos HTTP:

- retry apos refresh bem-sucedido;
- limpeza de sessao quando o refresh falha.
- login por senha;
- logout e limpeza local mesmo em falha de rede;
- download de blobs e envelopes de erro;
- contratos dos clientes de auth, client, office, portfolio, workbench, compliance e delivery;
- estados responsivos, vazios, parciais e indisponiveis nas telas principais.

## Licenca

Distribuido sob a licenca MIT. Veja [LICENSE](LICENSE).

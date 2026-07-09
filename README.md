# front-risk-calculator

Frontend Next.js + TypeScript do Risk Calculator, uma plataforma de analytics de portfolios de
investimento. Este projeto apresenta a experiencia do usuario: autenticacao, portfolios,
dashboards de analytics, relatorios, alertas e atualizacoes realtime.

## Estado atual

Este diretorio esta em fase de bootstrap. Antes de implementar codigo, leia:

- [Guia do projeto](.codex/AGENTS.md)
- [Contexto do workspace](../.specs/context.md)
- [Visao de produto](../.specs/product/vision.md)
- [Arquitetura](../.specs/architecture/overview.md)
- [Convencoes de API](../.specs/api/conventions.md)
- A macro spec da feature em `../.specs/features/<feature>/`

As specs vivem apenas na raiz do workspace. Nao crie `front-risk-calculator/.specs/`.

## Responsabilidades

- Apresentar login, logout, bootstrap de sessao e telas protegidas.
- Consumir apenas contratos REST/realtime do backend.
- Renderizar portfolios, posicoes, transacoes, analytics, relatorios, alertas e notificacoes.
- Mostrar estados de loading, vazio, erro, nao autorizado, dados parciais, dados obsoletos e
  processamento assincrono.
- Exibir metricas e insights gerados pelo backend como explicacoes, nao como recomendacoes.
- Usar tabelas para dados operacionais, graficos para alocacao/performance e texto conciso para insights.
- Manter a UI profissional, analitica e eficiente para uso repetido.

## Stack planejada

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js App Router |
| Linguagem | TypeScript |
| UI | React |
| Server state | TanStack Query ou equivalente |
| Formularios | React Hook Form + validacao por schema |
| Graficos | Recharts, Tremor, Visx ou biblioteca documentada |
| Estilo | Tailwind CSS ou design system definido pelo projeto |
| Testes | Vitest, React Testing Library e Playwright |

## Arquitetura esperada

Layout esperado:

```text
front-risk-calculator/
  src/
    app/
      (auth)/
      (dashboard)/
    components/
      layout/
      portfolio/
      analytics/
      reports/
      ui/
    features/
      auth/
      portfolios/
      analytics/
      reports/
      alerts/
    lib/
      api/
      auth/
      realtime/
      formatters/
    types/
  tests/
    e2e/
    unit/
```

## Desenvolvimento local

O scaffold de aplicacao ainda nao foi criado. Quando existir `package.json`, os comandos
esperados devem seguir este formato:

```bash
npm install
npm run dev
npm test
```

A API local planejada para consumo e:

```text
http://localhost:8000/api/v1
```

## Regras importantes

- Nao chame provedores de dados de mercado diretamente do browser, server components ou route handlers.
- Nao implemente formulas de analytics no frontend, exceto formatacao presentacional.
- Nao trate UI escondida como barreira de seguranca; RBAC e decisao do backend.
- Nao armazene refresh tokens em `localStorage`.
- Prefira tipos gerados a partir do contrato OpenAPI quando ele existir.
- Evite linguagem de recomendacao financeira; a UI deve explicar risco e metricas.

## Licenca

Distribuido sob a licenca MIT. Veja [LICENSE](LICENSE).

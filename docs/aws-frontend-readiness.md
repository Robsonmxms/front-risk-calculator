# AWS Frontend Readiness

## Hosting Target

The current AWS-ready frontend target is a Node container using Next.js `output: "standalone"`.
This fits App Runner, ECS/Fargate, or another container runtime behind CloudFront.

Static export to S3/CloudFront is not the selected target yet because the app has protected
client-side routes, dynamic route shells, and runtime session behavior that still need a dedicated
static-export audit.

## Container Runtime

The production Docker image copies the standalone Next.js server and starts:

```bash
node server.js
```

The image exposes port `3000` and sets:

- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `HOSTNAME=0.0.0.0`
- `PORT=3000`

## Public API Promotion

`NEXT_PUBLIC_API_BASE_URL` is browser-visible and is inlined at build time. For production-like
builds, it must point to the promoted backend API base path, for example:

```text
https://api.example.com/api/v1
```

Run this before production-like builds:

```bash
DEPLOY_TARGET=aws NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1 yarn check:public-config
```

The check fails when the URL is missing, not absolute, points to localhost, or does not end with
`/api/v1`.

This is intentionally public configuration. Backend secrets, secret identifiers, credentials, and
the runtime configuration document specified by root feature
`1 - centralized-secrets-runtime-configuration` must never use `NEXT_PUBLIC_*`, enter the browser
bundle, or be returned by an API payload.

The current Dockerfile runs `yarn build` without declaring a build argument for
`NEXT_PUBLIC_API_BASE_URL` and does not run `check:public-config` inside the image build. Therefore,
the image pipeline is not yet self-validating: before promotion, the Docker build path must be
updated so the build stage receives and validates the public API base URL. Runtime-only injection
after `next build` cannot replace a value already inlined into the client bundle.

## Current Performance Guardrails

The frontend already keeps business data behind backend authorization and uses client-side session
bootstrap. Before production-scale traffic, chart-heavy routes still need browser profiling with
realistic payloads:

- `/dashboard`
- `/dashboard/portfolios/[portfolioId]`
- `/dashboard/workbench`
- `/dashboard/analytics-diagnostics`
- `/dashboard/compliance`
- `/dashboard/report-delivery`

The next hardening step is section-level lazy loading or route-level splitting for chart panels
whose data can be fetched after the primary page shell renders.

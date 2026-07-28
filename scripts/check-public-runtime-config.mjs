const deployTarget = process.env.DEPLOY_TARGET ?? "";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const productionLikeTargets = new Set(["aws", "staging", "production", "prod"]);

if (!productionLikeTargets.has(deployTarget)) {
  process.exit(0);
}

if (!apiBaseUrl.trim()) {
  console.error("NEXT_PUBLIC_API_BASE_URL is required for production-like frontend builds.");
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(apiBaseUrl);
} catch {
  console.error("NEXT_PUBLIC_API_BASE_URL must be an absolute URL.");
  process.exit(1);
}

if (["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
  console.error("NEXT_PUBLIC_API_BASE_URL must not point to localhost for production-like builds.");
  process.exit(1);
}

if (!parsedUrl.pathname.replace(/\/+$/, "").endsWith("/api/v1")) {
  console.error("NEXT_PUBLIC_API_BASE_URL must include the /api/v1 base path.");
  process.exit(1);
}

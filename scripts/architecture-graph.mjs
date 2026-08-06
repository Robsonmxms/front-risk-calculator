import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);
const ATOMIC_RANK = new Map([
  ["atoms", 0],
  ["molecules", 1],
  ["organisms", 2],
  ["templates", 3]
]);

export function collectSourceFiles(rootDirectory) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(absolutePath);
    }
  };
  visit(rootDirectory);
  return files.sort();
}

export function collectModuleSpecifiers(sourceText, fileName = "source.ts") {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  const specifiers = [];
  const addLiteral = (node) => {
    if (node && ts.isStringLiteralLike(node)) specifiers.push(node.text);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) addLiteral(node.moduleSpecifier);
    else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) addLiteral(node.arguments[0]);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

export function findRouteLocalComponents(sourceText, fileName = "page.tsx") {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = [];
  const isUppercaseName = (name) => Boolean(name && /^[A-Z]/.test(name));
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && isUppercaseName(statement.name?.text)) {
      const isDefault = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword);
      if (!isDefault) names.push(statement.name.text);
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          isUppercaseName(declaration.name.text) &&
          declaration.initializer &&
          (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))
        ) names.push(declaration.name.text);
      }
    }
  }
  return names;
}

export function findCycles(graph) {
  const cycles = [];
  const state = new Map();
  const stack = [];
  const visit = (file) => {
    state.set(file, "visiting");
    stack.push(file);
    for (const dependency of graph.get(file) ?? []) {
      if (!graph.has(dependency)) continue;
      if (state.get(dependency) === "visiting") {
        cycles.push([...stack.slice(stack.indexOf(dependency)), dependency]);
      } else if (!state.has(dependency)) visit(dependency);
    }
    stack.pop();
    state.set(file, "visited");
  };
  for (const file of graph.keys()) if (!state.has(file)) visit(file);
  return cycles;
}

export function describeFrontendArea(relativeFile) {
  const parts = relativeFile.split("/");
  if (parts[0] === "components") return { kind: "components", name: parts[1], rank: ATOMIC_RANK.get(parts[1]) };
  if (parts[0] === "features") return { kind: "features", name: parts[1] };
  return { kind: parts[0], name: parts[0] };
}

export function validateFrontendDependency(importerRelative, importedRelative) {
  const importer = describeFrontendArea(importerRelative);
  const imported = describeFrontendArea(importedRelative);
  if (imported.kind === "app" && importer.kind !== "app") return "only app routes may depend on src/app";
  if (["lib", "components"].includes(importer.kind) && imported.kind === "features") {
    return `${importer.kind} must remain feature-neutral`;
  }
  if (importer.kind === "components") {
    if (imported.kind === "app" || imported.kind === "features") return "atomic components cannot depend on app or features";
    if (imported.kind === "components" && imported.rank > importer.rank) {
      return `${importer.name} cannot import upward from ${imported.name}`;
    }
  }
  if (importer.kind === "features" && imported.kind === "features" && importer.name !== imported.name) {
    if (importedRelative !== `features/${imported.name}/index.ts`) {
      return `cross-feature imports must use features/${imported.name}/index.ts`;
    }
  }
  return undefined;
}

export function resolveProductionGraph(files, compilerOptions) {
  const canonicalFiles = new Set(files.map((file) => path.resolve(file)));
  const graph = new Map();
  for (const file of canonicalFiles) {
    const dependencies = [];
    for (const specifier of collectModuleSpecifiers(fs.readFileSync(file, "utf8"), file)) {
      const resolved = ts.resolveModuleName(specifier, file, compilerOptions, ts.sys).resolvedModule;
      if (!resolved) continue;
      const target = path.resolve(resolved.resolvedFileName);
      if (canonicalFiles.has(target)) dependencies.push(target);
    }
    graph.set(file, [...new Set(dependencies)]);
  }
  return graph;
}

export function relativePath(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

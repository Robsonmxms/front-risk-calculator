import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  collectSourceFiles,
  findCycles,
  findRouteLocalComponents,
  relativePath,
  resolveProductionGraph,
  validateFrontendDependency
} from "./architecture-graph.mjs";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const componentsRoot = path.join(sourceRoot, "components");
const requiredAtomicRoots = new Set(["atoms", "molecules", "organisms", "templates"]);
const failures = [];

for (const entry of fs.readdirSync(componentsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !requiredAtomicRoots.has(entry.name)) {
    failures.push(`src/components/${entry.name} violates the Atomic Design source-root allowlist`);
  }
}
for (const requiredRoot of requiredAtomicRoots) {
  if (!fs.existsSync(path.join(componentsRoot, requiredRoot))) failures.push(`src/components/${requiredRoot} is required`);
}

const configPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, "tsconfig.json");
const config = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, projectRoot);
const files = collectSourceFiles(sourceRoot);
const graph = resolveProductionGraph(files, config.options);

for (const [importer, dependencies] of graph) {
  const importerRelative = relativePath(sourceRoot, importer);
  for (const imported of dependencies) {
    const importedRelative = relativePath(sourceRoot, imported);
    const violation = validateFrontendDependency(importerRelative, importedRelative);
    if (violation) failures.push(`${importerRelative} -> ${importedRelative}: ${violation}`);
  }
}

for (const page of files.filter((file) => /(?:^|\/)app\/.*\/page\.tsx$/.test(file))) {
  const localComponents = findRouteLocalComponents(fs.readFileSync(page, "utf8"), page);
  if (localComponents.length > 0) {
    failures.push(`${relativePath(sourceRoot, page)} declares route-local components: ${localComponents.join(", ")}`);
  }
}

for (const cycle of findCycles(graph)) {
  failures.push(`production cycle: ${cycle.map((file) => relativePath(sourceRoot, file)).join(" -> ")}`);
}

if (failures.length > 0) {
  console.error(`Frontend architecture check failed (${failures.length} violation(s)):\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Frontend architecture check passed for ${files.length} production source files.`);
}

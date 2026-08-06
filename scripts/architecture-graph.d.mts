export function collectSourceFiles(rootDirectory: string): string[];
export function collectModuleSpecifiers(sourceText: string, fileName?: string): string[];
export function findRouteLocalComponents(sourceText: string, fileName?: string): string[];
export function findCycles(graph: Map<string, string[]>): string[][];
export function describeFrontendArea(relativeFile: string): { kind: string; name: string; rank?: number };
export function validateFrontendDependency(importerRelative: string, importedRelative: string): string | undefined;
export function resolveProductionGraph(files: string[], compilerOptions: object): Map<string, string[]>;
export function relativePath(root: string, file: string): string;

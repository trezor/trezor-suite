#!/usr/bin/env tsx
/**
 * Monorepo graph ingestion script.
 *
 * Parses all workspace package.json files in the Trezor Suite monorepo,
 * extracts internal dependency edges, and upserts Package nodes + DEPENDS_ON
 * relationships into Neo4j via @ai/graph-service.
 *
 * Usage:
 *   npx tsx scripts/ingest-graph.ts [--root <monorepo-root>] [--dry-run]
 *
 * Environment variables (or defaults used by GraphService):
 *   NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
 */

import { GraphService } from '@ai/graph-service';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ── CLI args ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const rootIdx = args.indexOf('--root');
// Default: two levels up from ai/scripts → monorepo root
const monorepoRoot =
    rootIdx !== -1 && args[rootIdx + 1]
        ? resolve(args[rootIdx + 1])
        : resolve(import.meta.dirname, '..', '..');

// ── Discover workspace package.json files ────────────────────

interface PackageInfo {
    name: string;
    version: string;
    path: string;
    deps: string[];
}

function readPackageJson(
    dir: string,
): {
    name?: string;
    version?: string;
    workspaces?: string[] | { packages?: string[] };
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
} | null {
    try {
        return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
    } catch {
        return null;
    }
}

function resolveGlob(pattern: string, base: string): string[] {
    // Simple glob: "packages/*" → list immediate subdirectories
    if (pattern.endsWith('/*')) {
        const parent = join(base, pattern.slice(0, -2));
        try {
            return readdirSync(parent)
                .map(entry => join(parent, entry))
                .filter(p => {
                    try {
                        return statSync(p).isDirectory();
                    } catch {
                        return false;
                    }
                });
        } catch {
            return [];
        }
    }

    // Non-glob: "scripts" → single directory
    const full = join(base, pattern);
    try {
        if (statSync(full).isDirectory()) return [full];
    } catch {
        /* not found */
    }

    return [];
}

function discoverPackages(root: string): PackageInfo[] {
    const rootPkg = readPackageJson(root);
    if (!rootPkg) {
        console.error(`No package.json found at ${root}`);
        process.exit(1);
    }

    // Support both array and {packages: []} workspace formats
    const globs: string[] = Array.isArray(rootPkg.workspaces)
        ? (rootPkg.workspaces as string[])
        : ((rootPkg.workspaces as { packages?: string[] })?.packages ?? []);

    const dirs = globs.flatMap(g => resolveGlob(g, root));

    // Collect all internal package names first
    const internalNames = new Set<string>();
    const pkgInfos: Array<{ dir: string; pkg: NonNullable<ReturnType<typeof readPackageJson>> }> =
        [];

    for (const dir of dirs) {
        const pkg = readPackageJson(dir);
        if (!pkg?.name) continue;
        internalNames.add(pkg.name);
        pkgInfos.push({ dir, pkg });
    }

    // Build PackageInfo with only internal dependencies
    return pkgInfos.map(({ dir, pkg }) => {
        const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
        };

        const internalDeps = Object.keys(allDeps).filter(d => internalNames.has(d));

        return {
            name: pkg.name!,
            version: pkg.version ?? '0.0.0',
            path: dir.replace(root, '').replace(/^\//, ''),
            deps: internalDeps,
        };
    });
}

// ── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log(`Scanning monorepo at ${monorepoRoot}…`);
    const packages = discoverPackages(monorepoRoot);
    console.log(`Found ${packages.length} workspace packages`);

    const totalEdges = packages.reduce((sum, p) => sum + p.deps.length, 0);
    console.log(`Total internal dependency edges: ${totalEdges}`);

    if (dryRun) {
        console.log('\n[dry-run] Would ingest:');
        for (const pkg of packages) {
            console.log(`  ${pkg.name} (${pkg.path})`);
            for (const dep of pkg.deps) {
                console.log(`    → ${dep}`);
            }
        }

        return;
    }

    const graphService = new GraphService(
        process.env.NEO4J_URI ?? 'bolt://localhost:7687',
        process.env.NEO4J_USER ?? 'neo4j',
        process.env.NEO4J_PASSWORD ?? 'neo4j',
    );

    try {
        await graphService.migrate();
        const result = await graphService.ingestPackages(packages);
        console.log(`Ingested ${result.nodesCreated} nodes, ${result.edgesCreated} edges`);
    } finally {
        await graphService.close();
    }
}

main().catch(err => {
    console.error('Ingestion failed:', err);
    process.exit(1);
});

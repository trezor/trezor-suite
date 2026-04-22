import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

import dts from 'rollup-plugin-dts';

const packagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'packages');

// Redirect "@trezor/*/src/*" imports (which TS generates from workspace symlinks to .ts
// sources) to pre-built .d.ts files in libDev/ so rollup-plugin-dts doesn't recompile them.
function redirectWorkspaceSrc() {
    return {
        name: 'redirect-workspace-src',
        resolveId(source) {
            const match = source.match(/^@trezor\/([^/]+)\/src\/(.+)$/);
            if (match) {
                const [, pkg, subpath] = match;
                for (const base of [
                    resolve(packagesDir, pkg, 'libDev', subpath),
                    resolve(packagesDir, pkg, 'libDev', 'src', subpath),
                ]) {
                    for (const candidate of [`${base}.d.ts`, `${base}/index.d.ts`]) {
                        if (existsSync(candidate)) {
                            return candidate;
                        }
                    }
                }
            }

            const pkgMatch = source.match(/^@trezor\/([^/]+)$/);
            if (pkgMatch) {
                const [, pkg] = pkgMatch;
                for (const candidate of [
                    resolve(packagesDir, pkg, 'libDev', 'index.d.ts'),
                    resolve(packagesDir, pkg, 'libDev', 'src', 'index.d.ts'),
                ]) {
                    if (existsSync(candidate)) {
                        return candidate;
                    }
                }
            }

            return null;
        },
    };
}

// External set of workspace packages = transitive closure of prod + peer deps starting
// from the building package's own package.json. These are guaranteed to land in the
// consumer's node_modules, so their root-level imports stay external. Workspace deps
// NOT in this set (typically devDeps and their transitive types) must be inlined.
function readWorkspaceExternals() {
    const visited = new Set();

    function visit(packageDir) {
        const pkgJsonPath = resolve(packageDir, 'package.json');
        if (!existsSync(pkgJsonPath)) return;

        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
        const directDeps = [
            ...Object.keys(pkgJson.dependencies || {}),
            ...Object.keys(pkgJson.peerDependencies || {}),
        ];

        for (const dep of directDeps) {
            if (visited.has(dep)) continue;
            visited.add(dep);

            if (dep.startsWith('@trezor/')) {
                visit(resolve(packagesDir, dep.replace('@trezor/', '')));
            }
        }
    }

    visit(process.cwd());

    return new Set([...visited].filter(dep => dep.startsWith('@trezor/')));
}

export function createDtsConfig() {
    const workspaceExternals = readWorkspaceExternals();
    const outDir = process.env.DTS_OUT_DIR || 'lib';

    return {
        input: `./${outDir}/index.d.ts`,
        output: {
            file: `./${outDir}/index.bundled.d.ts`,
            format: 'es',
        },
        plugins: [
            redirectWorkspaceSrc(),
            dts({
                respectExternal: true,
            }),
        ],
        // Externalization rules (only applied to bare package specifiers; relative/
        // absolute paths fall through and get bundled as usual):
        // - Workspace `@trezor/*` roots in the prod closure: external (consumer has them).
        // - Workspace `@trezor/*` not in the closure (devDep leaks): inlined.
        // - Workspace subpath imports (`@trezor/X/src/...`): handled by redirectWorkspaceSrc
        //   so the bundled entry never ends up referencing another package's unbundled file.
        // - Other bare specifiers (Node built-ins, npm packages): external. Inlining them
        //   would drag in JS sources without .d.ts and Node built-ins. `@types/node` covers
        //   built-ins; other npm types are a pre-existing concern of dep declarations.
        external: id => {
            if (id.startsWith('.') || id.startsWith('/')) return false;
            if (id.startsWith('@trezor/')) {
                return workspaceExternals.has(id);
            }
            return true;
        },
    };
}

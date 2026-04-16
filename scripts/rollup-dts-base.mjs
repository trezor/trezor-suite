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

// Source of truth: the public-package-dependencies snapshot in the requirements package.
// It lists every package the consumer ends up with after installing this one, so anything
// in it is safe to keep as an external import in the bundled .d.ts. Anything NOT in it
// must be inlined (consumer has no way to resolve it).
function readExternalPackages(packageName) {
    const snapshotFile = resolve(
        packagesDir,
        'requirements/src/requirements/public-package-dependencies/__snapshots__',
        `${packageName}.json`,
    );

    if (!existsSync(snapshotFile)) {
        throw new Error(
            `Missing public-package-dependencies snapshot for package "${packageName}" at "${snapshotFile}"`,
        );
    }

    let snapshot;
    try {
        snapshot = JSON.parse(readFileSync(snapshotFile, 'utf8'));
    } catch (error) {
        throw new Error(
            `Failed to read or parse public-package-dependencies snapshot for package "${packageName}" at "${snapshotFile}": ${error.message}`,
        );
    }

    if (!snapshot || !Array.isArray(snapshot.prod)) {
        throw new Error(
            `Invalid public-package-dependencies snapshot for package "${packageName}" at "${snapshotFile}": expected a JSON object with a "prod" array`,
        );
    }
    // Only @trezor/* are at risk of being inlined via workspace symlinks; everything else
    // (bignumber.js, ts-mixer, etc.) stays external automatically. Exclude the package
    // itself — it appears in its own snapshot but obviously can't import from itself.
    return snapshot.prod.filter(
        name => name.startsWith('@trezor/') && name !== `@trezor/${packageName}`,
    );
}

export function createDtsConfig({ packageName } = {}) {
    if (!packageName) {
        throw new Error('createDtsConfig requires a packageName');
    }

    const externalPackages = readExternalPackages(packageName);

    return {
        input: './lib/index.d.ts',
        output: {
            file: './lib/index.bundled.d.ts',
            format: 'es',
        },
        plugins: [
            redirectWorkspaceSrc(),
            dts({
                respectExternal: true,
            }),
        ],
        external: id => externalPackages.some(pkg => id === pkg || id.startsWith(`${pkg}/`)),
    };
}

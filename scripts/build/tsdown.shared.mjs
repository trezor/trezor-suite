// Shared tsdown config factory for @trezor/* publishable packages.
// Produces the ESM (lib/) layout the monorepo publishes, with @trezor/*
// workspace deps left external (so consumers resolve them via their own
// node_modules, not bundled in).
//
// Two output modes:
//   bundled  — explicit entries get a Rollup-style bundle with chunk splitting
//              (industry standard for libraries with a fixed public API).
//   unbundle — every src/**/*.ts is transpiled to its mirrored lib/**/*.mjs
//              (preserves file-by-file structure for packages whose
//              package.json exports include wildcard subpaths like `./lib/*`).
//
// Devdep type leaks (@trezor/* packages used as devDependencies whose types
// surface in the public API) are still handled by the legacy
// inline-devdep-types.mjs script, invoked from the post-build hook below when
// `inlineDevDepTypes: true` is passed to createConfig.
//
// Usage:
//   import { createConfig } from '../../scripts/build/tsdown.shared.mjs';
//   export default createConfig({ entry: ['src/index.ts'] });
//   export default createConfig({ unbundle: true });
//   export default createConfig({ unbundle: true, inlineDevDepTypes: true });

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'tsdown';

const POST_BUILD_SCRIPT = resolve(import.meta.dirname, 'post-build.mjs');
const INLINE_DEVDEP_TYPES_SCRIPT = resolve(import.meta.dirname, '..', 'inline-devdep-types.mjs');

const DEFAULT_UNBUNDLE_GLOB = [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/__fixtures__/**',
    '!src/**/__mocks__/**',
];

/**
 * @param {object} options
 * @param {string|string[]} [options.entry] - Bundled mode: explicit entry points.
 * @param {boolean} [options.unbundle] - Unbundle mode: transpile every src/**\/*.ts file 1:1.
 * @param {string[]} [options.unbundleEntry] - Override the default unbundle glob.
 * @param {boolean} [options.inlineDevDepTypes] - Bundle @trezor/* devDependency type
 *   declarations into the emitted .d.ts so the published package is self-contained.
 */
export function createConfig({
    entry,
    unbundle = false,
    unbundleEntry,
    inlineDevDepTypes = false,
}) {
    if (!entry && !unbundle) {
        throw new Error('createConfig: either `entry` or `unbundle: true` is required');
    }
    if (entry && unbundle) {
        throw new Error('createConfig: `entry` and `unbundle` are mutually exclusive');
    }

    const external = buildExternals(process.cwd());

    const baseShared = {
        entry: unbundle ? (unbundleEntry ?? DEFAULT_UNBUNDLE_GLOB) : entry,
        unbundle,
        external,
        clean: true,
        sourcemap: false,
        target: 'es2022',
        platform: 'neutral',
        dts: { sourcemap: false },
    };

    return defineConfig({
        ...baseShared,
        format: 'esm',
        outDir: 'lib',
        outExtensions: () => ({ js: '.mjs', dts: '.d.mts' }),
        onSuccess: postBuildHook('lib', 'esm', inlineDevDepTypes),
    });
}

// Externalize prod + peer + optional dependencies (what consumers will have
// installed) plus all @trezor/* workspace packages (devDep leaks are vendored
// post-build via inline-devdep-types.mjs, so the dts plugin must not try to
// resolve them through workspace src/ files which would break tsc references).
function buildExternals(packageRoot) {
    const pkg = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
    const deps = [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
        ...Object.keys(pkg.optionalDependencies ?? {}),
    ];
    return [
        ...deps.flatMap(dep => [dep, new RegExp(`^${escapeRegExp(dep)}/`)]),
        /^@trezor\//,
    ];
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function postBuildHook(outDirName, mode, inlineDevDepTypes) {
    return () => {
        execSync(`node "${POST_BUILD_SCRIPT}" "./${outDirName}" ${mode}`, {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        if (inlineDevDepTypes) {
            // inline-devdep-types.mjs reads .d.ts files from upstream workspace
            // packages' libDev/, with fallback to lib/. build:lib depends on
            // ^build:lib in nx.json so the upstream outputs exist.
            execSync(`node "${INLINE_DEVDEP_TYPES_SCRIPT}"`, {
                stdio: 'inherit',
                cwd: process.cwd(),
                env: { ...process.env, DTS_OUT_DIR: outDirName },
            });
        }
    };
}

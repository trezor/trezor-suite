#!/usr/bin/env node
// Walks a built `lib/` (or `libESM/`) tree, finds @trezor/* imports that aren't in the
// package's own prod+peer dependency closure (= devDep leaks the consumer can't resolve),
// bundles each leaked package's type declarations into its own `_vendor_<pkg>.d.ts`
// next to the entry, and rewrites every .d.ts in the tree to redirect those imports to
// the local vendor files. Both the root entry AND any subpath import resolve self-contained
// types without duplication: each leaked package lives in exactly one place, and vendor
// files cross-reference each other when they depend on another leaked package.

import { resolve, dirname, relative, join } from 'path';
import { fileURLToPath } from 'url';
import {
    existsSync,
    readFileSync,
    writeFileSync,
    readdirSync,
    statSync,
    rmSync,
    renameSync,
} from 'fs';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

const packagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'packages');

function readProdClosure(startDir) {
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
    visit(startDir);
    return new Set([...visited].filter(d => d.startsWith('@trezor/')));
}

function redirectWorkspaceSrc() {
    return {
        name: 'redirect-workspace-src',
        resolveId(source) {
            const subMatch = source.match(/^@trezor\/([^/]+)\/src\/(.+)$/);
            if (subMatch) {
                const [, pkg, subpath] = subMatch;
                for (const base of [
                    resolve(packagesDir, pkg, 'libDev', subpath),
                    resolve(packagesDir, pkg, 'libDev', 'src', subpath),
                ]) {
                    for (const candidate of [`${base}.d.ts`, `${base}/index.d.ts`]) {
                        if (existsSync(candidate)) return candidate;
                    }
                }
            }
            const rootMatch = source.match(/^@trezor\/([^/]+)$/);
            if (rootMatch) {
                const [, pkg] = rootMatch;
                for (const candidate of [
                    resolve(packagesDir, pkg, 'libDev', 'index.d.ts'),
                    resolve(packagesDir, pkg, 'libDev', 'src', 'index.d.ts'),
                ]) {
                    if (existsSync(candidate)) return candidate;
                }
            }
            return null;
        },
    };
}

function walkDts(dir, ext) {
    const out = [];
    if (!existsSync(dir)) return out;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) out.push(...walkDts(full, ext));
        else if (entry.endsWith(ext)) out.push(full);
    }
    return out;
}

const IMPORT_RE = /from\s*['"](@trezor\/[^'"]+)['"]/g;

function rootOf(spec) {
    return spec.split('/').slice(0, 2).join('/');
}

function scanLeaks(dtsFiles, prodClosure) {
    const leaks = new Set();
    for (const file of dtsFiles) {
        const content = readFileSync(file, 'utf8');
        for (const m of content.matchAll(IMPORT_RE)) {
            const root = rootOf(m[1]);
            if (!prodClosure.has(root)) leaks.add(root);
        }
    }
    return leaks;
}

// Recursively expand the leak set: each leaked package's libDev .d.ts may pull in
// other @trezor/* packages that aren't in the prod closure either; those become
// new leaks too. Without this, vendor files for the initial leaks would inline the
// transitive @trezor/* deps and create duplicate type definitions across vendors.
function expandLeakSet(initialLeaks, prodClosure) {
    const leaks = new Set(initialLeaks);
    const queue = [...initialLeaks];
    while (queue.length) {
        const pkg = queue.shift();
        const libDev = resolve(packagesDir, pkg.replace('@trezor/', ''), 'libDev');
        for (const file of walkDts(libDev, '.d.ts')) {
            const content = readFileSync(file, 'utf8');
            for (const m of content.matchAll(IMPORT_RE)) {
                const root = rootOf(m[1]);
                if (prodClosure.has(root)) continue;
                if (leaks.has(root)) continue;
                leaks.add(root);
                queue.push(root);
            }
        }
    }
    return leaks;
}

function vendorBaseName(pkg) {
    return `_vendor_${pkg.replace('@trezor/', '').replace(/-/g, '_')}`;
}

async function buildVendorForPackage(pkg, prodClosure, leakSet, libAbs, ext) {
    const baseName = vendorBaseName(pkg);
    const entryPath = resolve(libAbs, `${baseName}-entry.d.ts`);
    writeFileSync(entryPath, `export * from '${pkg}';\n`);

    try {
        const bundle = await rollup({
            input: entryPath,
            plugins: [redirectWorkspaceSrc(), dts({ respectExternal: true })],
            external: id => {
                if (id.startsWith('.') || id.startsWith('/')) return false;
                if (!id.startsWith('@trezor/')) return true;
                const root = rootOf(id);
                if (prodClosure.has(root)) return true;
                if (leakSet.has(root) && root !== pkg) return true;
                return false;
            },
            onwarn(warning, warn) {
                if (warning.code === 'CIRCULAR_DEPENDENCY') return;
                if (warning.code === 'UNRESOLVED_IMPORT') return;
                warn(warning);
            },
        });
        const tmpOut = resolve(libAbs, `${baseName}.d.ts`);
        await bundle.write({ file: tmpOut, format: 'es' });
        await bundle.close();
        if (ext !== '.d.ts') {
            renameSync(tmpOut, resolve(libAbs, `${baseName}${ext}`));
        }
    } finally {
        rmSync(entryPath, { force: true });
    }
}

function rewriteFile(file, leakSet, libAbs) {
    const original = readFileSync(file, 'utf8');
    const rewritten = original.replace(
        /(from\s*['"])(@trezor\/[^'"]+)(['"])/g,
        (full, pre, spec, post) => {
            const root = rootOf(spec);
            if (!leakSet.has(root)) return full;
            const targetAbs = resolve(libAbs, vendorBaseName(root));
            let rel = relative(dirname(file), targetAbs).replace(/\\/g, '/');
            if (!rel.startsWith('.')) rel = `./${rel}`;
            return `${pre}${rel}${post}`;
        },
    );
    if (rewritten !== original) writeFileSync(file, rewritten);
}

// In ESM mode (.d.mts), TypeScript with NodeNext/Node16 module resolution requires
// explicit file extensions in relative imports. tsc emits extensionless imports
// (`from './foo'`); we resolve each to the right `.mjs` extension (file or directory).
function addEsmExtensions(file) {
    const original = readFileSync(file, 'utf8');
    const fileDir = dirname(file);

    const rewritten = original.replace(
        /((?:from|import)\s*\(?\s*['"])(\.\.?(?:\/[^'"]*)?)(['"])/g,
        (full, pre, spec, post) => {
            if (/\.(mjs|cjs|js|json)$/.test(spec)) return full;
            const absPath = resolve(fileDir, spec);
            if (existsSync(`${absPath}.d.mts`)) {
                return `${pre}${spec}.mjs${post}`;
            }
            if (existsSync(`${absPath}/index.d.mts`)) {
                const sep = spec.endsWith('/') ? '' : '/';
                return `${pre}${spec}${sep}index.mjs${post}`;
            }
            return full;
        },
    );
    if (rewritten !== original) writeFileSync(file, rewritten);
}

async function main() {
    const libDir = process.env.DTS_OUT_DIR || 'lib';
    const libAbs = resolve(process.cwd(), libDir);
    if (!existsSync(libAbs)) {
        console.error(`inline-devdep-types: ${libAbs} does not exist`);
        process.exit(1);
    }

    // Detect output extension by sampling lib/index.d.{ts,mts}.
    const ext = existsSync(resolve(libAbs, 'index.d.mts')) ? '.d.mts' : '.d.ts';
    const dtsFiles = walkDts(libAbs, ext);

    const prodClosure = readProdClosure(process.cwd());
    const initialLeaks = scanLeaks(dtsFiles, prodClosure);
    const leakSet = expandLeakSet(initialLeaks, prodClosure);

    if (leakSet.size === 0) {
        console.log(`inline-devdep-types: no devDep leaks in ${libDir}, skipping`);
        return;
    }

    console.log(`inline-devdep-types: bundling ${leakSet.size} leak package(s) into ${libDir}/`);
    for (const pkg of leakSet) console.log(`  - ${pkg}`);

    for (const pkg of leakSet) {
        await buildVendorForPackage(pkg, prodClosure, leakSet, libAbs, ext);
    }

    // Rewrite imports in the package's own .d.ts files AND in the just-built vendor
    // files (they may import each other when leak packages cross-reference).
    const allFiles = walkDts(libAbs, ext);
    for (const file of allFiles) rewriteFile(file, leakSet, libAbs);

    // Add explicit `.mjs` extensions to relative imports in ESM declaration files.
    // tsc emits extensionless imports; ESM (NodeNext/Node16) resolution requires them.
    if (ext === '.d.mts') {
        for (const file of allFiles) addEsmExtensions(file);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

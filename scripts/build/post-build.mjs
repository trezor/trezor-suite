#!/usr/bin/env node
// Post-process tsdown output for monorepo publishing:
// 1. Rewrite `@trezor/<pkg>/src/<sub>` → `@trezor/<pkg>/<libDir>/<sub>` (so consumers
//    of the published package resolve to built artifacts, not workspace src/).
// 2. In ESM mode, append `.mjs` to extensionless `@trezor/<pkg>/lib/<sub>` imports
//    (NodeNext requires explicit extensions; resolves directory paths to /index.mjs).
// 3. Apply both rewrites to .js/.mjs (output JS) and .d.ts/.d.mts (declaration files).
//
// Usage: node post-build.mjs <outDir> <cjs|esm>
//   e.g. node post-build.mjs ./lib esm

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const [, , outDirArg, mode] = process.argv;
if (!outDirArg || !['cjs', 'esm'].includes(mode)) {
    console.error('Usage: post-build.mjs <outDir> <cjs|esm>');
    process.exit(1);
}

const outDir = resolve(process.cwd(), outDirArg);
if (!existsSync(outDir)) {
    console.error(`post-build: ${outDir} does not exist`);
    process.exit(1);
}

const libDir = 'lib';
const SRC_RE = /@trezor\/([a-zA-Z0-9-]+)\/src(?=['"`/])/g;
const TS_DYN_EXT_RE = /\.ts(?=['"`])/g;

const packagesRoot = resolve(import.meta.dirname, '..', '..', 'packages');

function walkFiles(dir, exts) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) out.push(...walkFiles(full, exts));
        else if (exts.some(ext => entry.endsWith(ext))) out.push(full);
    }
    return out;
}

// Replace `@trezor/<pkg>/src/...` with `@trezor/<pkg>/<libDir>/...` in any string context.
function rewriteSrcPaths(content) {
    return content.replace(SRC_RE, (_full, pkg) => `@trezor/${pkg}/${libDir}`);
}

// Replace dynamic `.ts` extensions with `.js` (e.g. inside dynamic import strings
// that reference TS files by extension).
function rewriteDynamicTsExt(content) {
    return content.replace(TS_DYN_EXT_RE, '.js');
}

// In ESM mode, append `.mjs` to extensionless `@trezor/<pkg>/lib/<sub>` imports.
// Resolve directory vs file by inspecting the source workspace package.
const TREZOR_LIB_RE = /(@trezor\/[a-zA-Z0-9-]+\/lib\/[^'"`)\s]+)/g;

function appendMjsToTrezorLib(content) {
    return content.replace(TREZOR_LIB_RE, match => {
        if (/\.(mjs|cjs|js|json)$/.test(match)) return match;
        const m = match.match(/^@trezor\/([a-zA-Z0-9-]+)\/lib\/(.+)$/);
        if (!m) return match;
        const [, pkg, sub] = m;
        const srcPath = join(packagesRoot, pkg, 'src', sub);
        const isDir = existsSync(srcPath) && statSync(srcPath).isDirectory();
        return isDir ? `${match}/index.mjs` : `${match}.mjs`;
    });
}

// In ESM .d.mts files, tsdown emits relative imports without extensions for type-only
// imports in some cases — append `.mjs` (or `/index.mjs` for directories) to match
// NodeNext resolution.
const RELATIVE_IMPORT_RE = /((?:from|import)\s*\(?\s*['"])(\.\.?(?:\/[^'"`]*)?)(['"])/g;

function appendMjsToRelative(content, fileDir) {
    return content.replace(RELATIVE_IMPORT_RE, (full, pre, spec, post) => {
        if (/\.(mjs|cjs|js|json)$/.test(spec)) return full;
        const abs = resolve(fileDir, spec);
        if (existsSync(`${abs}.d.mts`) || existsSync(`${abs}.mjs`)) {
            return `${pre}${spec}.mjs${post}`;
        }
        if (existsSync(`${abs}/index.d.mts`) || existsSync(`${abs}/index.mjs`)) {
            const sep = spec.endsWith('/') ? '' : '/';
            return `${pre}${spec}${sep}index.mjs${post}`;
        }
        return full;
    });
}

// rolldown-plugin-dts emits invalid `typeof void 0` in declaration files when the
// source uses `typeof undefined` (semantically identical types). Rewrite it back so
// consumers' .d.ts parsers don't choke. Restricted to declaration files since
// `typeof void 0` is not meaningful in runtime code.
const TYPEOF_VOID_0_RE = /typeof void 0/g;

function fixTypeofVoid0(content) {
    return content.replace(TYPEOF_VOID_0_RE, 'undefined');
}


const jsExts = mode === 'esm' ? ['.mjs'] : ['.js', '.cjs'];
const dtsExts = mode === 'esm' ? ['.d.mts'] : ['.d.ts', '.d.cts'];
const allFiles = walkFiles(outDir, [...jsExts, ...dtsExts]);

let changed = 0;
for (const file of allFiles) {
    const original = readFileSync(file, 'utf8');
    let rewritten = rewriteSrcPaths(original);
    rewritten = rewriteDynamicTsExt(rewritten);
    if (mode === 'esm') {
        rewritten = appendMjsToTrezorLib(rewritten);
        if (file.endsWith('.d.mts')) {
            rewritten = appendMjsToRelative(rewritten, dirname(file));
            rewritten = fixTypeofVoid0(rewritten);
        }
    }
    if (rewritten !== original) {
        writeFileSync(file, rewritten);
        changed += 1;
    }
}

console.log(`post-build: rewrote imports in ${changed}/${allFiles.length} files (${mode}, ${outDirArg})`);

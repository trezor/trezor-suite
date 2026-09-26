import { type TransformOptions, transformSync } from '@babel/core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import addEsmExtension from './babel-plugin-add-js-extension.js';
import sanitizeInternalImports from './babel-plugin-sanitize-internal-imports.js';

// These plugins decide file-vs-directory by stat-ing the on-disk src/ tree next to the file being
// transformed, so the suite builds a throwaway package layout and points `filename` into its lib/.
//
//   <root>/blockchain-link/src/workers/{solana,blockbook}/index.ts  (directories → /index.js)
//   <root>/blockchain-link/src/workers/baseWorker.ts                (file       → .js)
//   <root>/connect-core/lib/workers/localdir/index.js               (directory  → /index.js)
//   <root>/connect-core/lib/workers/localfile.js                    (file       → .js)
let root: string;
let esmFilename: string;
let dtsFilename: string;

beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-transform-'));

    const workers = path.join(root, 'blockchain-link', 'src', 'workers');
    for (const dir of ['solana', 'blockbook']) {
        fs.mkdirSync(path.join(workers, dir), { recursive: true });
        fs.writeFileSync(path.join(workers, dir, 'index.ts'), '');
    }
    fs.writeFileSync(path.join(workers, 'baseWorker.ts'), '');

    const libWorkers = path.join(root, 'connect-core', 'lib', 'workers');
    fs.mkdirSync(path.join(libWorkers, 'localdir'), { recursive: true });
    fs.writeFileSync(path.join(libWorkers, 'localdir', 'index.js'), '');
    fs.writeFileSync(path.join(libWorkers, 'localfile.js'), '');

    esmFilename = path.join(libWorkers, 'workers.js');
    dtsFilename = path.join(root, 'connect-core', 'lib', 'index.d.ts');
});

afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
});

const transform = (code: string, options: TransformOptions) => {
    const result = transformSync(code, {
        configFile: false,
        babelrc: false,
        sourceType: 'module',
        ...options,
    });
    if (!result?.code) throw new Error('transform produced no output');

    return result.code;
};

// Composes both plugins in the same order as babel.config.json (sanitize src→lib first, then the
// extension pass), which is the pipeline replace-imports.sh runs over built .js files.
const runEsm = (code: string) =>
    transform(code, {
        filename: esmFilename,
        plugins: [sanitizeInternalImports, addEsmExtension],
    });

// Mirrors babel.config.ts.json: only the extension pass runs, with the dts parser. The src→lib
// rewrite happened earlier via sed, so inputs here already reference /lib/.
const runDts = (code: string) =>
    transform(code, {
        filename: dtsFilename,
        parserOpts: { plugins: [['typescript', { dts: true }]] },
        plugins: [addEsmExtension],
    });

describe('publish import transforms — specifier positions', () => {
    it('static import: src→lib and directory → /index.js', () => {
        const out = runEsm(`import { solana } from '@trezor/blockchain-link/src/workers/solana';`);
        expect(out).toContain('@trezor/blockchain-link/lib/workers/solana/index.js');
    });

    it('static import: file specifier → .js', () => {
        const out = runEsm(
            `import { baseWorker } from '@trezor/blockchain-link/src/workers/baseWorker';`,
        );
        expect(out).toContain('@trezor/blockchain-link/lib/workers/baseWorker.js');
    });

    it('relative import: directory → /index.js, file → .js', () => {
        const out = runEsm(`import './localdir';\nimport './localfile';`);
        expect(out).toContain('./localdir/index.js');
        expect(out).toContain('./localfile.js');
    });

    it('dynamic import(): src→lib and directory → /index.js', () => {
        const out = runEsm(
            `export const w = () => import('@trezor/blockchain-link/src/workers/solana');`,
        );
        expect(out).toContain('@trezor/blockchain-link/lib/workers/solana/index.js');
    });

    it('new URL(..., import.meta.url): rewrites the worker specifier', () => {
        const out = runEsm(
            `new Worker(new URL('@trezor/blockchain-link/src/workers/blockbook', import.meta.url));`,
        );
        expect(out).toContain('@trezor/blockchain-link/lib/workers/blockbook/index.js');
    });

    it('new URL(relative, import.meta.url): appends the extension', () => {
        const out = runEsm(`new Worker(new URL('./localfile', import.meta.url));`);
        expect(out).toContain('./localfile.js');
    });

    it('TSImportType in .d.ts: appends the extension', () => {
        const out = runDts(
            `export declare const w: import('@trezor/blockchain-link/lib/workers/solana').Worker;`,
        );
        expect(out).toContain('@trezor/blockchain-link/lib/workers/solana/index.js');
    });
});

describe('publish import transforms — new URL is gated on import.meta.url', () => {
    it('leaves a runtime new URL(relative, base) untouched', () => {
        const out = runEsm(`const u = new URL('./api/status', origin);`);
        expect(out).toContain('./api/status');
        expect(out).not.toContain('./api/status.js');
    });

    it('leaves a new URL(@trezor/*/src, base) untouched when base is not import.meta.url', () => {
        const out = runEsm(
            `const u = new URL('@trezor/blockchain-link/src/workers/blockbook', base);`,
        );
        expect(out).toContain('@trezor/blockchain-link/src/workers/blockbook');
        expect(out).not.toContain('/lib/');
    });

    it('leaves a single-argument new URL(literal) untouched', () => {
        const out = runEsm(`const u = new URL('./api/status');`);
        expect(out).not.toContain('./api/status.js');
    });
});

describe('publish import transforms — preserved behaviors', () => {
    // Guards the pre-existing isStringLiteral check (shared by every rewrite position), not the
    // import.meta.url gate: a non-literal specifier can never be resolved to a runtime path.
    it('leaves a new URL(variable, ...) with a non-literal specifier untouched', () => {
        const out = runEsm(`const u = new URL(specifier, import.meta.url);`);
        expect(out).toContain('new URL(specifier, import.meta.url)');
    });

    it('keeps JSON imports extensionless and adds the type attribute', () => {
        const out = runEsm(`import config from './localfile.json';`);
        expect(out).toContain('./localfile.json');
        expect(out).not.toContain('./localfile.json.js');
        expect(out).toMatch(/type:\s*["']json["']/);
    });

    it('is idempotent: transforming already-transformed output is a no-op', () => {
        const source = [
            `import { solana } from '@trezor/blockchain-link/src/workers/solana';`,
            `import './localdir';`,
            `export const w = () => import('@trezor/blockchain-link/src/workers/blockbook');`,
            `new Worker(new URL('./localfile', import.meta.url));`,
        ].join('\n');

        const once = runEsm(source);
        const twice = runEsm(once);
        expect(twice).toBe(once);
    });
});

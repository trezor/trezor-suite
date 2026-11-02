import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { findCoinSelectionClassNames, findReachableExports } from './coinSelectionExports';
import { readInputs } from './inputs';

const committedDir = path.resolve(__dirname, '../../generated/csl-asmjs');
const manifest = JSON.parse(fs.readFileSync(path.join(committedDir, 'manifest.json'), 'utf8'));

const getFileHash = (filePath: string) =>
    createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

// Proves the committed build is neither stale nor hand-edited without rerunning Binaryen.
describe('generated Cardano Serialization Lib asm.js build', () => {
    it.each(['cardano_serialization_lib.asm.js', 'cardano_serialization_lib_bg.js'])(
        'is not an unresolved Git LFS pointer: %s',
        file => {
            const head = fs.readFileSync(path.join(committedDir, file), 'utf8').slice(0, 64);

            expect(head).not.toMatch(/^version https:\/\/git-lfs/);
        },
    );

    it('was generated from the current inputs', () => {
        expect(readInputs(__dirname, require).inputsHash).toBe(manifest.inputsHash);
    });

    it.each(Object.keys(manifest.outputHashes))('is unchanged since generation: %s', file => {
        expect(getFileHash(path.join(committedDir, file))).toBe(manifest.outputHashes[file]);
    });

    it('ignores references inside comments of coin selection', () => {
        const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coin-selection-'));
        try {
            fs.writeFileSync(
                path.join(srcDir, 'sign.ts'),
                [
                    "import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';",
                    '// CardanoWasm.Commented.line',
                    '/* CardanoWasm.Commented.block */ CardanoWasm.Vkey.new();',
                    "const url = 'https://trezor.io'; CardanoWasm.Vkey.from_bytes();",
                ].join('\n'),
            );

            expect(findCoinSelectionClassNames(srcDir)).toEqual(['Vkey']);
        } finally {
            fs.rmSync(srcDir, { recursive: true, force: true });
        }
    });

    it('exports every function coin selection can reach through the glue', () => {
        const asmJs = fs.readFileSync(
            path.join(committedDir, 'cardano_serialization_lib.asm.js'),
            'utf8',
        );
        const exported = new Set(
            [...asmJs.matchAll(/^export var (\w+) =/gm)].map(([, name]) => name),
        );
        const { reachableExports } = readInputs(__dirname, require);

        expect(reachableExports.filter(name => !exported.has(name))).toEqual([]);
    });

    describe('findReachableExports', () => {
        const glueSource = [
            'export function __wbg_log_1(arg0) {',
            '    wasm.__wbindgen_free(arg0);',
            '}',
            'export class Builder {',
            '    static new() {',
            '        const ret = wasm.builder_new();',
            '        return Builder.__wrap(ret);',
            '    }',
            '    build() {',
            '        const ret = wasm.builder_build(this.__wbg_ptr);',
            '        return Body.__wrap(ret);',
            '    }',
            '    unused() {',
            '        wasm.builder_unused(this.__wbg_ptr);',
            '    }',
            '}',
            'export class Body {',
            '    to_hex() {',
            '        wasm.body_to_hex(this.__wbg_ptr);',
            '    }',
            '}',
            'export class Unreachable {',
            '    to_hex() {',
            '        wasm.unreachable_to_hex(this.__wbg_ptr);',
            '    }',
            '}',
            'export function min_fee(tx) {',
            '    return wasm.min_fee(tx.__wbg_ptr);',
            '}',
        ].join('\n');

        const withCoinSelection = (
            files: Record<string, string>,
            run: (srcDir: string) => void,
        ) => {
            const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coin-selection-'));
            try {
                Object.entries(files).forEach(([name, source]) =>
                    fs.writeFileSync(path.join(srcDir, name), source),
                );
                run(srcDir);
            } finally {
                fs.rmSync(srcDir, { recursive: true, force: true });
            }
        };

        it('follows returned classes and keeps only the members coin selection calls', () => {
            withCoinSelection(
                {
                    'compose.ts': [
                        "import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';",
                        'const body = CardanoWasm.Builder.new().build();',
                        'body.to_hex();',
                    ].join('\n'),
                    'fee.mjs': [
                        "import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';",
                        'CardanoWasm.min_fee(body);',
                    ].join('\n'),
                    'types.ts': [
                        "import type * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';",
                        'export type Output = CardanoWasm.Body;',
                    ].join('\n'),
                    'compose.test.tsx': [
                        "import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';",
                        'CardanoWasm.Unreachable.new().to_hex(); CardanoWasm.Builder.new().unused();',
                    ].join('\n'),
                    'glue.d.ts': [
                        "import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';",
                        'CardanoWasm.Unreachable.new();',
                    ].join('\n'),
                },
                srcDir => {
                    expect(findReachableExports(srcDir, glueSource)).toEqual([
                        '__wbindgen_free',
                        'body_to_hex',
                        'builder_build',
                        'builder_new',
                        'min_fee',
                    ]);
                },
            );
        });

        it('rejects a computed member call it cannot resolve', () => {
            withCoinSelection({ 'compose.ts': 'const body = builder["build"]();' }, srcDir => {
                expect(() => findReachableExports(srcDir, glueSource)).toThrow(
                    'computed member call',
                );
            });
        });

        it('rejects an import form it cannot resolve', () => {
            withCoinSelection(
                {
                    'compose.ts':
                        "import { Builder } from '@emurgo/cardano-serialization-lib-nodejs';",
                },
                srcDir => {
                    expect(() => findReachableExports(srcDir, glueSource)).toThrow(
                        'unrecognised Cardano Serialization Lib import',
                    );
                },
            );
        });

        it('rejects a glue class line it cannot attribute to a method', () => {
            withCoinSelection({ 'compose.ts': '' }, srcDir => {
                const getterGlue = glueSource.replace('    to_hex() {', '    get hex() {');

                expect(() => findReachableExports(srcDir, getterGlue)).toThrow(
                    'unrecognised line in glue class Body',
                );
            });
        });
    });
});

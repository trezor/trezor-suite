import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { findCoinSelectionExports } from './coinSelectionExports';
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
        const libDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coin-selection-'));
        try {
            fs.writeFileSync(
                path.join(libDir, 'sign.js'),
                [
                    'const CardanoWasm = __importStar(require("@emurgo/cardano-serialization-lib-nodejs"));',
                    '// CardanoWasm.Commented.line',
                    '/* CardanoWasm.Commented.block */ CardanoWasm.Vkey.new();',
                    "const url = 'https://trezor.io'; CardanoWasm.Vkey.from_bytes();",
                ].join('\n'),
            );

            expect(findCoinSelectionExports(libDir)).toEqual(['vkey_from_bytes', 'vkey_new']);
        } finally {
            fs.rmSync(libDir, { recursive: true, force: true });
        }
    });

    it('exports every function coin selection references', () => {
        const asmJs = fs.readFileSync(
            path.join(committedDir, 'cardano_serialization_lib.asm.js'),
            'utf8',
        );
        const exported = new Set(
            [...asmJs.matchAll(/^export var (\w+) =/gm)].map(([, name]) => name),
        );
        const coinSelectionLibDir = path.join(
            path.dirname(require.resolve('@fivebinaries/coin-selection/package.json')),
            'lib/cjs',
        );

        expect(
            findCoinSelectionExports(coinSelectionLibDir).filter(name => !exported.has(name)),
        ).toEqual([]);
    });
});

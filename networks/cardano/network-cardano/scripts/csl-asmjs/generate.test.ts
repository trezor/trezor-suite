import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const committedDir = path.resolve(__dirname, '../../generated/csl-asmjs');
const outputFiles = [
    'cardano_serialization_lib.asm.js',
    'cardano_serialization_lib_bg.js',
    'cardano_serialization_lib.js',
    'manifest.json',
];

const getFileHash = (filePath: string) =>
    createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

// Proves the committed build is neither stale nor hand-edited.
describe('generated Cardano Serialization Lib asm.js build', () => {
    it.each(['cardano_serialization_lib.asm.js', 'cardano_serialization_lib_bg.js'])(
        'is not an unresolved Git LFS pointer: %s',
        file => {
            const head = fs.readFileSync(path.join(committedDir, file), 'utf8').slice(0, 64);

            expect(head).not.toMatch(/^version https:\/\/git-lfs/);
        },
    );

    it('matches a fresh generation from the pinned inputs', () => {
        const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csl-asmjs-'));
        try {
            execFileSync(process.execPath, [path.join(__dirname, 'generate.js')], {
                env: { ...process.env, CSL_ASMJS_OUTPUT_DIR: outputDir },
                stdio: 'pipe',
            });

            const hashes = outputFiles.map(file => ({
                file,
                committed: getFileHash(path.join(committedDir, file)),
                generated: getFileHash(path.join(outputDir, file)),
            }));

            hashes.forEach(({ committed, generated }) => expect(committed).toBe(generated));
        } finally {
            fs.rmSync(outputDir, { recursive: true, force: true });
        }
    }, 300_000);
});

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

jest.mock('node:child_process');

import type { RepoContext } from '../../Requirement';
import { requireNativeTranslationKeys } from '../requireNativeTranslationKeys';

const translationKeysPath = join('suite-native', 'intl', 'src', 'generated', 'translationKeys.ts');

const createTempRepo = (): string => mkdtempSync(join(tmpdir(), 'native-translation-keys-'));

const writeTranslationKeys = (repoRoot: string, content: string) => {
    const filePath = join(repoRoot, translationKeysPath);

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
};

describe(requireNativeTranslationKeys.name, () => {
    let repoRoot: string;
    let context: RepoContext;

    beforeEach(() => {
        repoRoot = createTempRepo();
        context = { repoRoot };

        jest.mocked(execFileSync).mockReset();
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    it('passes when the generator leaves translation keys unchanged', async () => {
        writeTranslationKeys(repoRoot, 'generated keys\n');

        const errors = await requireNativeTranslationKeys.verify(context);

        expect(errors).toEqual([]);
        expect(execFileSync).toHaveBeenCalledWith(
            'yarn',
            ['workspace', '@suite-native/intl', 'translations:generate-keys'],
            {
                cwd: repoRoot,
                stdio: 'pipe',
            },
        );
    });

    it('reports out-of-sync translation keys when the generator changes the file', async () => {
        writeTranslationKeys(repoRoot, 'old keys\n');

        jest.mocked(execFileSync).mockImplementation(() => {
            writeTranslationKeys(repoRoot, 'new keys\n');

            return Buffer.from('');
        });

        const errors = await requireNativeTranslationKeys.verify(context);

        expect(errors).toEqual([
            'suite-native/intl/src/generated/translationKeys.ts is out of sync. Commit the result of "yarn workspace @suite-native/intl translations:generate-keys".',
        ]);
        expect(readFileSync(join(repoRoot, translationKeysPath), 'utf-8')).toBe('new keys\n');
    });

    it('fixes out-of-sync translation keys by running the generator', async () => {
        writeTranslationKeys(repoRoot, 'old keys\n');

        jest.mocked(execFileSync)
            .mockImplementationOnce(() => {
                writeTranslationKeys(repoRoot, 'new keys\n');

                return Buffer.from('');
            })
            .mockImplementationOnce(() => Buffer.from(''));

        const errors = await requireNativeTranslationKeys.fix?.(context);

        expect(errors).toEqual([]);
        expect(readFileSync(join(repoRoot, translationKeysPath), 'utf-8')).toBe('new keys\n');
        expect(execFileSync).toHaveBeenCalledTimes(2);
    });

    it('has repo scope', () => {
        expect(requireNativeTranslationKeys.scope).toBe('repo');
    });
});

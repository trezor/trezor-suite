import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { normalizePath, walkDirectory } from './fileSystem';

describe(walkDirectory.name, () => {
    let rootDirectory: string;

    beforeEach(() => {
        rootDirectory = mkdtempSync(join(tmpdir(), 'walk-directory-'));
    });

    afterEach(() => {
        rmSync(rootDirectory, { recursive: true, force: true });
    });

    it('walks files recursively and skips excluded directories', () => {
        const nestedDirectory = join(rootDirectory, 'nested');
        const excludedDirectory = join(rootDirectory, 'excluded');
        mkdirSync(nestedDirectory);
        mkdirSync(excludedDirectory);
        writeFileSync(join(rootDirectory, 'root.ts'), '');
        writeFileSync(join(nestedDirectory, 'nested.ts'), '');
        writeFileSync(join(excludedDirectory, 'excluded.ts'), '');

        const files = [
            ...walkDirectory(rootDirectory, {
                shouldEnterDirectory: ({ entry }) => entry.name !== 'excluded',
            }),
        ]
            .filter(({ entry }) => entry.isFile())
            .map(({ path }) => normalizePath(relative(rootDirectory, path)))
            .sort();

        expect(files).toEqual(['nested/nested.ts', 'root.ts']);
    });
});

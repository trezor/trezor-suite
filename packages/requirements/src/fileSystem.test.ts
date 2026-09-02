import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { normalizePath, walkDirectory } from './fileSystem';

describe(walkDirectory.name, () => {
    let rootDirectory: string;

    const generateMockFileSystem = () => {
        const nestedDirectory = join(rootDirectory, 'nested');
        const excludedDirectory = join(rootDirectory, 'excluded');
        mkdirSync(nestedDirectory);
        mkdirSync(excludedDirectory);
        writeFileSync(join(rootDirectory, 'root.ts'), '');
        writeFileSync(join(nestedDirectory, 'nested.ts'), '');
        writeFileSync(join(excludedDirectory, 'excluded.ts'), '');
    };

    beforeEach(() => {
        rootDirectory = mkdtempSync(join(tmpdir(), 'walk-directory-'));
    });

    afterEach(() => {
        rmSync(rootDirectory, { recursive: true, force: true });
    });

    it('walks files recursively and skips excluded directories', () => {
        generateMockFileSystem();
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

    it('filters yielded files without affecting directory traversal', () => {
        generateMockFileSystem();
        const files = [
            ...walkDirectory(rootDirectory, {
                fileFilter: ({ entry }) => entry.name.endsWith('.ts'),
            }),
        ]
            .map(({ path }) => normalizePath(relative(rootDirectory, path)))
            .sort();

        expect(files).toEqual(['excluded/excluded.ts', 'nested/nested.ts', 'root.ts']);
    });

    it('combines all options', () => {
        generateMockFileSystem();
        const files = [
            ...walkDirectory(rootDirectory, {
                shouldEnterDirectory: ({ entry }) => entry.name !== 'excluded',
                fileFilter: ({ entry }) => entry.name.endsWith('.ts'),
            }),
        ]
            .map(({ path }) => normalizePath(relative(rootDirectory, path)))
            .sort();

        expect(files).toEqual(['nested/nested.ts', 'root.ts']);
    });
});

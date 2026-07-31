import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { listAllWorkspaces } from '../../workspaces';
import type { RepoContext } from '../Requirement';
import {
    MAX_DECLARATION_SIZE_BYTES,
    MAX_DECLARATION_SOURCE_RATIO,
    MIN_DECLARATION_RATIO_SIZE_BYTES,
    createRequireTypeDeclarationSize,
    requireTypeDeclarationSize,
} from './requireTypeDeclarationSize';

jest.mock('../../workspaces');

const mockListAllWorkspaces = jest.mocked(listAllWorkspaces);

describe(requireTypeDeclarationSize.name, () => {
    let legitBigFiles: Set<string>;
    let knownDeclarationSizeViolations: Set<string>;
    let requireTypeDeclarationSizeForTest: ReturnType<typeof createRequireTypeDeclarationSize>;
    let repoRoot: string;
    let sourceDirectory: string;
    let libDevDirectory: string;
    let context: RepoContext;

    beforeEach(() => {
        legitBigFiles = new Set();
        knownDeclarationSizeViolations = new Set();
        requireTypeDeclarationSizeForTest = createRequireTypeDeclarationSize({
            legitBigFiles,
            knownDeclarationSizeViolations,
        });
        repoRoot = mkdtempSync(join(tmpdir(), 'type-declarations-'));
        sourceDirectory = join(repoRoot, 'packages', 'example', 'src');
        libDevDirectory = join(repoRoot, 'packages', 'example', 'libDev');
        context = { repoRoot };

        mkdirSync(sourceDirectory, { recursive: true });
        mkdirSync(join(libDevDirectory, 'src'), { recursive: true });
        mockListAllWorkspaces.mockReturnValue([
            {
                dir: join(repoRoot, 'packages', 'example'),
                name: '@trezor/example',
            },
        ]);
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    it('passes when emitted declarations are within the size limit', async () => {
        writeFileSync(
            join(libDevDirectory, 'src', 'small.d.ts'),
            'export declare const small = 1;',
        );

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports emitted declarations that exceed the size limit', async () => {
        writeFileSync(
            join(libDevDirectory, 'src', 'large.d.ts'),
            `export declare const large: "${'x'.repeat(MAX_DECLARATION_SIZE_BYTES)}";`,
        );

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(
            /^packages\/example\/libDev\/src\/large\.d\.ts is \d+(?:\.\d+)? KiB; maximum is 50 KiB\./,
        );
        expect(errors[0]).toContain(
            'Large generated declarations slow TypeScript and IDE performance.',
        );
        expect(errors[0]).toContain('add an explicit type or return type to the source export');
        expect(errors[0]).toContain('yarn type-check --output-style=stream');
        expect(errors[0]).toContain('yarn requirements:verify --only=type-declaration-size');
    });

    it('reports declarations larger than 5 KiB that exceed five times their source size', async () => {
        writeFileSync(join(sourceDirectory, 'bloated.ts'), 'export const bloated = 1;');
        writeFileSync(
            join(libDevDirectory, 'src', 'bloated.d.ts'),
            'x'.repeat(MIN_DECLARATION_RATIO_SIZE_BYTES + 1),
        );

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(
            /^packages\/example\/libDev\/src\/bloated\.d\.ts is \d+(?:\.\d+)? KiB, \d+(?:\.\d+)?x the size of packages\/example\/src\/bloated\.ts \(\d+(?:\.\d+)? B\); maximum is 5x for declarations larger than 5 KiB\./,
        );
        expect(errors[0]).toContain(
            'Large generated declarations slow TypeScript and IDE performance.',
        );
        expect(errors[0]).toContain('add an explicit type or return type to the source export');
    });

    it('uses declaration maps when the output path does not match the source path', async () => {
        const nestedDeclarationDirectory = join(libDevDirectory, 'example', 'src');
        const declarationFile = join(nestedDeclarationDirectory, 'mapped.d.ts');
        mkdirSync(nestedDeclarationDirectory, { recursive: true });
        writeFileSync(join(sourceDirectory, 'mapped.ts'), 'export const mapped = 1;');
        writeFileSync(declarationFile, 'x'.repeat(MIN_DECLARATION_RATIO_SIZE_BYTES + 1));
        writeFileSync(
            `${declarationFile}.map`,
            JSON.stringify({ sources: ['../../../src/mapped.ts'] }),
        );

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('packages/example/libDev/example/src/mapped.d.ts');
        expect(errors[0]).toContain('the size of packages/example/src/mapped.ts');
    });

    it('does not check the source ratio at the minimum declaration size', async () => {
        writeFileSync(join(sourceDirectory, 'minimum.ts'), 'x');
        writeFileSync(
            join(libDevDirectory, 'src', 'minimum.d.ts'),
            'x'.repeat(MIN_DECLARATION_RATIO_SIZE_BYTES),
        );

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toEqual([]);
    });

    it('allows declarations at the maximum source ratio', async () => {
        const sourceSizeBytes = 1025;
        const declarationSizeBytes = sourceSizeBytes * MAX_DECLARATION_SOURCE_RATIO;
        writeFileSync(join(sourceDirectory, 'ratio.ts'), 'x'.repeat(sourceSizeBytes));
        writeFileSync(join(libDevDirectory, 'src', 'ratio.d.ts'), 'x'.repeat(declarationSizeBytes));

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports known violations that no longer exceed either limit', async () => {
        knownDeclarationSizeViolations.add('packages/example/libDev/src/receiveSlice.d.ts');
        writeFileSync(join(sourceDirectory, 'receiveSlice.ts'), 'export const small = 1;');
        writeFileSync(join(libDevDirectory, 'src', 'receiveSlice.d.ts'), 'export const small = 1;');

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain(
            'packages/example/libDev/src/receiveSlice.d.ts no longer violates declaration size limits.',
        );
        expect(errors[0]).toContain(
            'The generated declaration is now within the configured limits, so its temporary exception is stale.',
        );
        expect(errors[0]).toContain('KNOWN_DECLARATION_SIZE_VIOLATIONS');
        expect(errors[0]).toContain(
            'packages/requirements/src/requirements/type-declarations/requireTypeDeclarationSize.ts',
        );
        expect(errors[0]).toContain('yarn requirements:verify --only=type-declaration-size');
    });

    it('explains how to fix a known violation that was not emitted', async () => {
        knownDeclarationSizeViolations.add('packages/example/libDev/src/receiveSlice.d.ts');

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain(
            'packages/example/libDev/src/receiveSlice.d.ts was not emitted at the expected path.',
        );
        expect(errors[0]).toContain(
            'Remove the path from the set if the declaration was deleted, or update it if the declaration moved',
        );
        expect(errors[0]).toContain('KNOWN_DECLARATION_SIZE_VIOLATIONS');
    });

    it('scans declaration outputs recursively', async () => {
        const nestedDirectory = join(libDevDirectory, 'src', 'nested');
        mkdirSync(nestedDirectory);
        writeFileSync(
            join(nestedDirectory, 'large.d.mts'),
            'x'.repeat(MAX_DECLARATION_SIZE_BYTES + 1),
        );

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors[0]).toContain('packages/example/libDev/src/nested/large.d.mts');
    });

    it('ignores schema-derived types that are legitimately large', async () => {
        legitBigFiles.add('packages/example/libDev/src/authenticateDeviceParams.d.ts');
        writeFileSync(
            join(libDevDirectory, 'src', 'authenticateDeviceParams.d.ts'),
            'x'.repeat(200 * 1024),
        );

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toEqual([]);
    });

    it('does not validate legacy limits for workspaces without declaration output', async () => {
        knownDeclarationSizeViolations.add('suite-native/intl/libDev/src/messages.d.ts');
        const knownWorkspaceDirectory = join(repoRoot, 'suite-native', 'intl');
        mkdirSync(knownWorkspaceDirectory, { recursive: true });
        mockListAllWorkspaces.mockReturnValue([
            { dir: knownWorkspaceDirectory, name: '@suite-native/intl' },
        ]);

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toEqual([]);
    });

    it('ignores workspaces without declaration output', async () => {
        rmSync(libDevDirectory, { recursive: true, force: true });

        const errors = await requireTypeDeclarationSizeForTest.verify(context);

        expect(errors).toEqual([]);
    });

    it('has repo scope', () => {
        expect(requireTypeDeclarationSize.scope).toBe('repo');
    });

    it('only runs when selected explicitly', () => {
        expect(requireTypeDeclarationSize.runByDefault).toBe(false);
    });
});

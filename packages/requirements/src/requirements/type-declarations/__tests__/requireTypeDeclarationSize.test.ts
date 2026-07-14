import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { listAllWorkspaces } from '../../../workspaces';
import type { RepoContext } from '../../Requirement';
import {
    MAX_DECLARATION_SIZE_BYTES,
    requireTypeDeclarationSize,
} from '../requireTypeDeclarationSize';

jest.mock('../../../workspaces');

const mockListAllWorkspaces = jest.mocked(listAllWorkspaces);

describe(requireTypeDeclarationSize.name, () => {
    let repoRoot: string;
    let libDevDirectory: string;
    let context: RepoContext;

    beforeEach(() => {
        repoRoot = mkdtempSync(join(tmpdir(), 'type-declarations-'));
        libDevDirectory = join(repoRoot, 'packages', 'example', 'libDev');
        context = { repoRoot };

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

        const errors = await requireTypeDeclarationSize.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports emitted declarations that exceed the size limit', async () => {
        writeFileSync(
            join(libDevDirectory, 'src', 'large.d.ts'),
            `export declare const large: "${'x'.repeat(MAX_DECLARATION_SIZE_BYTES)}";`,
        );

        const errors = await requireTypeDeclarationSize.verify(context);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(
            /^packages\/example\/libDev\/src\/large\.d\.ts is \d+(?:\.\d+)? KiB; maximum is 100 KiB\.$/,
        );
    });

    it('scans declaration outputs recursively', async () => {
        const nestedDirectory = join(libDevDirectory, 'src', 'nested');
        mkdirSync(nestedDirectory);
        writeFileSync(
            join(nestedDirectory, 'large.d.mts'),
            'x'.repeat(MAX_DECLARATION_SIZE_BYTES + 1),
        );

        const errors = await requireTypeDeclarationSize.verify(context);

        expect(errors[0]).toContain('packages/example/libDev/src/nested/large.d.mts');
    });

    it('allows known oversized declarations up to their legacy limit', async () => {
        const knownWorkspaceDirectory = join(repoRoot, 'packages', 'icons');
        const knownDeclarationDirectory = join(
            knownWorkspaceDirectory,
            'libDev',
            'src',
            'generated',
            'icons',
        );
        mkdirSync(knownDeclarationDirectory, { recursive: true });
        writeFileSync(join(knownDeclarationDirectory, 'index.d.ts'), 'x'.repeat(180 * 1024));
        mockListAllWorkspaces.mockReturnValue([
            { dir: knownWorkspaceDirectory, name: '@trezor/icons' },
        ]);

        const errors = await requireTypeDeclarationSize.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports legacy limits that can be removed', async () => {
        const knownWorkspaceDirectory = join(repoRoot, 'packages', 'icons');
        const knownDeclarationDirectory = join(
            knownWorkspaceDirectory,
            'libDev',
            'src',
            'generated',
            'icons',
        );
        mkdirSync(knownDeclarationDirectory, { recursive: true });
        writeFileSync(join(knownDeclarationDirectory, 'index.d.ts'), 'x'.repeat(90 * 1024));
        mockListAllWorkspaces.mockReturnValue([
            { dir: knownWorkspaceDirectory, name: '@trezor/icons' },
        ]);

        const errors = await requireTypeDeclarationSize.verify(context);

        expect(errors).toEqual([
            'packages/icons/libDev/src/generated/icons/index.d.ts is now 90 KiB; remove its legacy declaration-size limit.',
        ]);
    });

    it('reports legacy limits for declarations missing from built workspaces', async () => {
        const knownWorkspaceDirectory = join(repoRoot, 'packages', 'icons');
        mkdirSync(join(knownWorkspaceDirectory, 'libDev'), { recursive: true });
        mockListAllWorkspaces.mockReturnValue([
            { dir: knownWorkspaceDirectory, name: '@trezor/icons' },
        ]);

        const errors = await requireTypeDeclarationSize.verify(context);

        expect(errors).toEqual([
            'packages/icons/libDev/src/generated/icons/index.d.ts no longer exists; remove or update its legacy declaration-size limit.',
        ]);
    });

    it('does not validate legacy limits for workspaces without declaration output', async () => {
        const knownWorkspaceDirectory = join(repoRoot, 'suite-native', 'intl');
        mkdirSync(knownWorkspaceDirectory, { recursive: true });
        mockListAllWorkspaces.mockReturnValue([
            { dir: knownWorkspaceDirectory, name: '@suite-native/intl' },
        ]);

        const errors = await requireTypeDeclarationSize.verify(context);

        expect(errors).toEqual([]);
    });

    it('ignores workspaces without declaration output', async () => {
        rmSync(libDevDirectory, { recursive: true, force: true });

        const errors = await requireTypeDeclarationSize.verify(context);

        expect(errors).toEqual([]);
    });

    it('has repo scope', () => {
        expect(requireTypeDeclarationSize.scope).toBe('repo');
    });

    it('only runs when selected explicitly', () => {
        expect(requireTypeDeclarationSize.runByDefault).toBe(false);
    });
});

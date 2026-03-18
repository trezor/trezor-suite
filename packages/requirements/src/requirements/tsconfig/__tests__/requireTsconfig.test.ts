import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requireTsconfig } from '../requireTsconfig';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'tsconfig-'));

describe(requireTsconfig.name, () => {
    let repoRoot: string;
    let workspaceDir: string;
    let context: WorkspaceContext;

    beforeEach(() => {
        repoRoot = createTempWorkspace();
        workspaceDir = join(repoRoot, 'packages/example');
        mkdirSync(workspaceDir, { recursive: true });
        context = {
            repoRoot,
            workspaceDir,
            workspaceName: '@trezor/example',
        };
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    it('passes when extends and tsBuildInfoFile are configured correctly', async () => {
        writeFileSync(
            join(workspaceDir, 'tsconfig.json'),
            JSON.stringify({
                extends: '../../tsconfig.base.json',
                compilerOptions: { tsBuildInfoFile: './dist/.tsbuildinfo', outDir: 'libDev' },
            }),
        );

        const errors = await requireTsconfig.verify(context);

        expect(errors).toEqual([]);
    });

    it('computes the required extends path from the workspace location', async () => {
        workspaceDir = join(repoRoot, 'scripts');
        mkdirSync(workspaceDir, { recursive: true });
        context = {
            ...context,
            workspaceDir,
            workspaceName: '@trezor/scripts',
        };

        writeFileSync(
            join(workspaceDir, 'tsconfig.json'),
            JSON.stringify({
                extends: '../../tsconfig.base.json',
                compilerOptions: { tsBuildInfoFile: './dist/.tsbuildinfo' },
            }),
        );

        const errors = await requireTsconfig.verify(context);

        expect(errors).toEqual([
            '@trezor/scripts: extends must be "../tsconfig.base.json" in tsconfig.json.',
        ]);
    });

    it('reports missing tsBuildInfoFile', async () => {
        writeFileSync(
            join(workspaceDir, 'tsconfig.json'),
            JSON.stringify({
                extends: '../../tsconfig.base.json',
                compilerOptions: { outDir: 'libDev' },
            }),
        );

        const errors = await requireTsconfig.verify(context);

        expect(errors).toEqual([
            '@trezor/example: compilerOptions.tsBuildInfoFile must be "./dist/.tsbuildinfo" in tsconfig.json.',
        ]);
    });

    it('reports missing or invalid tsconfig.json', async () => {
        const errorsWithoutFile = await requireTsconfig.verify(context);

        expect(errorsWithoutFile).toEqual([
            '@trezor/example: tsconfig.json is missing or contains invalid JSON.',
        ]);

        writeFileSync(join(workspaceDir, 'tsconfig.json'), '{ invalid json }');

        const errorsInvalidJson = await requireTsconfig.verify(context);

        expect(errorsInvalidJson).toEqual([
            '@trezor/example: tsconfig.json is missing or contains invalid JSON.',
        ]);
    });

    it('has workspace scope', () => {
        expect(requireTsconfig.scope).toBe('workspace');
    });
});

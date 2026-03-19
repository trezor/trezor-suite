import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requireTypecheckConfig } from '../requireTypecheckConfig';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'typecheck-config-'));

describe(requireTypecheckConfig.name, () => {
    let workspaceDir: string;
    let context: WorkspaceContext;

    beforeEach(() => {
        workspaceDir = createTempWorkspace();
        context = {
            repoRoot: '/repo',
            workspaceDir,
            workspaceName: '@trezor/example',
        };
    });

    afterEach(() => {
        rmSync(workspaceDir, { recursive: true, force: true });
    });

    it('passes when both config files exist and typecheck config enables declaration boundary resolution', async () => {
        writeFileSync(
            join(workspaceDir, 'tsconfig.json'),
            JSON.stringify({ extends: '../../tsconfig.base.json' }),
        );
        writeFileSync(
            join(workspaceDir, 'tsconfig.typecheck.json'),
            JSON.stringify({
                extends: './tsconfig.json',
                compilerOptions: {
                    disableSourceOfProjectReferenceRedirect: true,
                },
            }),
        );

        const errors = await requireTypecheckConfig.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports missing tsconfig.json', async () => {
        writeFileSync(
            join(workspaceDir, 'tsconfig.typecheck.json'),
            JSON.stringify({
                compilerOptions: {
                    disableSourceOfProjectReferenceRedirect: true,
                },
            }),
        );

        const errors = await requireTypecheckConfig.verify(context);

        expect(errors).toEqual([
            '@trezor/example: tsconfig.json is missing or contains invalid JSON.',
        ]);
    });

    it('reports missing tsconfig.typecheck.json', async () => {
        writeFileSync(
            join(workspaceDir, 'tsconfig.json'),
            JSON.stringify({ extends: '../../tsconfig.base.json' }),
        );

        const errors = await requireTypecheckConfig.verify(context);

        expect(errors).toEqual([
            '@trezor/example: tsconfig.typecheck.json is missing or contains invalid JSON.',
        ]);
    });

    it('reports invalid JSON in either config file', async () => {
        writeFileSync(join(workspaceDir, 'tsconfig.json'), '{ invalid json }');
        writeFileSync(join(workspaceDir, 'tsconfig.typecheck.json'), '{ invalid json }');

        const errors = await requireTypecheckConfig.verify(context);

        expect(errors).toEqual([
            '@trezor/example: tsconfig.json is missing or contains invalid JSON.',
            '@trezor/example: tsconfig.typecheck.json is missing or contains invalid JSON.',
        ]);
    });

    it('reports missing disableSourceOfProjectReferenceRedirect flag', async () => {
        writeFileSync(
            join(workspaceDir, 'tsconfig.json'),
            JSON.stringify({ extends: '../../tsconfig.base.json' }),
        );
        writeFileSync(
            join(workspaceDir, 'tsconfig.typecheck.json'),
            JSON.stringify({
                extends: './tsconfig.json',
                compilerOptions: {},
            }),
        );

        const errors = await requireTypecheckConfig.verify(context);

        expect(errors).toEqual([
            '@trezor/example: tsconfig.typecheck.json must set compilerOptions.disableSourceOfProjectReferenceRedirect to true.',
        ]);
    });

    it('reports false disableSourceOfProjectReferenceRedirect flag', async () => {
        writeFileSync(
            join(workspaceDir, 'tsconfig.json'),
            JSON.stringify({ extends: '../../tsconfig.base.json' }),
        );
        writeFileSync(
            join(workspaceDir, 'tsconfig.typecheck.json'),
            JSON.stringify({
                extends: './tsconfig.json',
                compilerOptions: {
                    disableSourceOfProjectReferenceRedirect: false,
                },
            }),
        );

        const errors = await requireTypecheckConfig.verify(context);

        expect(errors).toEqual([
            '@trezor/example: tsconfig.typecheck.json must set compilerOptions.disableSourceOfProjectReferenceRedirect to true.',
        ]);
    });

    it('does not apply to configured connect example packages', () => {
        context = {
            ...context,
            workspaceName: 'connect-example-node',
        };

        expect(requireTypecheckConfig.applies?.(context)).toBe(false);
    });

    it('has workspace scope', () => {
        expect(requireTypecheckConfig.scope).toBe('workspace');
    });
});

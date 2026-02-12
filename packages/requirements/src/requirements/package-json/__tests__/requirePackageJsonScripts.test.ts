import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requirePackageJsonScripts } from '../requirePackageJsonScripts';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'package-json-'));

describe(requirePackageJsonScripts.name, () => {
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

    it('passes when depcheck script is configured correctly', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ scripts: { depcheck: 'yarn g:depcheck' } }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports missing depcheck script', async () => {
        writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify({ scripts: {} }));

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([
            '@trezor/example: scripts.depcheck must be "yarn g:depcheck" in package.json.',
        ]);
    });

    it('reports invalid depcheck value', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ scripts: { depcheck: 'depcheck' } }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([
            '@trezor/example: scripts.depcheck must be "yarn g:depcheck" in package.json.',
        ]);
    });

    it('reports missing or invalid package.json', async () => {
        const errorsWithoutFile = await requirePackageJsonScripts.verify(context);

        expect(errorsWithoutFile).toEqual([
            '@trezor/example: package.json is missing or contains invalid JSON.',
        ]);

        writeFileSync(join(workspaceDir, 'package.json'), '{ invalid json }');

        const errorsInvalidJson = await requirePackageJsonScripts.verify(context);

        expect(errorsInvalidJson).toEqual([
            '@trezor/example: package.json is missing or contains invalid JSON.',
        ]);
    });

    it('has workspace scope', () => {
        expect(requirePackageJsonScripts.scope).toBe('workspace');
    });

    it('ignores depcheck requirement for configured packages', async () => {
        context = {
            ...context,
            workspaceName: 'connect-example-node',
        };

        writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify({ scripts: {} }));

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });
});

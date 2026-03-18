import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requirePackageJsonScripts } from '../requirePackageJsonScripts';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'package-json-'));

const validScripts = {
    depcheck: 'yarn g:depcheck',
    'lint:js': "yarn g:eslint '**/*.{ts,tsx,js}'",
    'type-check': 'yarn g:tsc --build',
};

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

    it('passes when all required scripts are configured correctly', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ scripts: validScripts }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('passes when type-check script matches the configured regex', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    ...validScripts,
                    'type-check': 'yarn g:tsc --build tsconfig.json',
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports missing depcheck script', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    'lint:js': validScripts['lint:js'],
                    'type-check': validScripts['type-check'],
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([
            '@trezor/example: scripts.depcheck must be "yarn g:depcheck" in package.json.',
        ]);
    });

    it('reports invalid depcheck value', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    ...validScripts,
                    depcheck: 'depcheck',
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([
            '@trezor/example: scripts.depcheck must be "yarn g:depcheck" in package.json.',
        ]);
    });

    it('reports invalid type-check value when it does not match the configured regex', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    ...validScripts,
                    'type-check': 'tsc --build tsconfig.json',
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([
            '@trezor/example: scripts.type-check must be matching /^yarn g:tsc --build.*$/ in package.json.',
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

        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    'lint:js': validScripts['lint:js'],
                    'type-check': validScripts['type-check'],
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });
});

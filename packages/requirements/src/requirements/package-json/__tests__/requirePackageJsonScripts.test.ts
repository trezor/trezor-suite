import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requirePackageJsonScripts } from '../requirePackageJsonScripts';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'package-json-'));

const validScripts = {
    depcheck: 'yarn g:depcheck',
    'lint:js': "yarn g:eslint '**/*.{ts,tsx,js}'",
    'type-check': 'yarn g:tsc --build tsconfig.typecheck.json',
};

const validPackageJson = {
    main: 'src/index',
    types: './libDev/src/index.d.ts',
    scripts: validScripts,
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
        writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(validPackageJson));

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports missing depcheck script', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                main: 'src/index',
                types: './libDev/src/index.d.ts',
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
                main: 'src/index',
                types: './libDev/src/index.d.ts',
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

    it('reports invalid type-check value when it does not match the configured command', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                main: 'src/index',
                types: './libDev/src/index.d.ts',
                scripts: {
                    ...validScripts,
                    'type-check': 'tsc --build tsconfig.json',
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([
            '@trezor/example: scripts.type-check must be "yarn g:tsc --build tsconfig.typecheck.json" in package.json.',
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

    it('reports missing local types entry for source-entry workspaces', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                main: 'src/index',
                scripts: validScripts,
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([
            '@trezor/example: types must be "./libDev/src/index.d.ts" in package.json.',
        ]);
    });

    it('does not require local types when the workspace has no standard source entrypoint', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: validScripts,
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('ignores type-check requirement for configured connect example packages', async () => {
        context = {
            ...context,
            workspaceName: 'connect-example-node',
        };

        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    depcheck: validScripts.depcheck,
                    'lint:js': validScripts['lint:js'],
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
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

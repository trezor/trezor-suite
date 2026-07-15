import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requirePackageJsonScripts } from '../requirePackageJsonScripts';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'package-json-'));

const validScripts = {
    depcheck: 'yarn g:depcheck',
    'lint:js': "yarn g:eslint '**/*.{ts,tsx,js}'",
    'test:unit': 'yarn g:jest',
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

    it('passes without test:unit script when package has no test files', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    depcheck: validScripts.depcheck,
                    'lint:js': validScripts['lint:js'],
                    'type-check': validScripts['type-check'],
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('passes without test:unit script when package has only e2e test files', async () => {
        mkdirSync(join(workspaceDir, 'e2e'), { recursive: true });
        writeFileSync(join(workspaceDir, 'e2e', 'example.test.ts'), '');
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    depcheck: validScripts.depcheck,
                    'lint:js': validScripts['lint:js'],
                    'type-check': validScripts['type-check'],
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('passes without test:unit script when package has only package template test files', async () => {
        mkdirSync(join(workspaceDir, 'package-template', 'src', '__tests__'), {
            recursive: true,
        });
        writeFileSync(
            join(workspaceDir, 'package-template', 'src', '__tests__', 'example.test.ts'),
            '',
        );
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    depcheck: validScripts.depcheck,
                    'lint:js': validScripts['lint:js'],
                    'type-check': validScripts['type-check'],
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports missing test:unit script when package has test files', async () => {
        mkdirSync(join(workspaceDir, 'src', '__tests__'), { recursive: true });
        writeFileSync(join(workspaceDir, 'src', '__tests__', 'example.test.ts'), '');
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    depcheck: validScripts.depcheck,
                    'lint:js': validScripts['lint:js'],
                    'type-check': validScripts['type-check'],
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([
            '@trezor/example: scripts.test:unit must be defined in package.json.',
        ]);
    });

    it('accepts custom test:unit script value when package has test files', async () => {
        mkdirSync(join(workspaceDir, 'src', '__tests__'), { recursive: true });
        writeFileSync(join(workspaceDir, 'src', '__tests__', 'example.test.ts'), '');
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    ...validScripts,
                    'test:unit': 'jest',
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
    });

    it('ignores test:unit requirement for configured packages', async () => {
        context = {
            ...context,
            workspaceName: '@trezor/suite-e2e',
        };

        mkdirSync(join(workspaceDir, 'tests'), { recursive: true });
        writeFileSync(join(workspaceDir, 'tests', 'example.test.ts'), '');
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                scripts: {
                    depcheck: validScripts.depcheck,
                    'lint:js': validScripts['lint:js'],
                    'type-check': validScripts['type-check'],
                },
            }),
        );

        const errors = await requirePackageJsonScripts.verify(context);

        expect(errors).toEqual([]);
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

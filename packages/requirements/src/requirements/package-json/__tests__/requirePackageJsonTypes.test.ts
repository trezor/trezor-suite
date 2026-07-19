import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requirePackageJsonTypes } from '../requirePackageJsonTypes';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'package-json-types-'));

describe(requirePackageJsonTypes.name, () => {
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

    it('passes when types is configured correctly', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ types: './libDev/src/index.d.ts' }),
        );

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports missing types', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ name: '@trezor/example' }),
        );

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([
            '@trezor/example: types must be "./libDev/src/index.d.ts" in package.json.',
        ]);
    });

    it('reports invalid types', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ types: './lib/index.d.ts' }),
        );

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([
            '@trezor/example: types must be "./libDev/src/index.d.ts" in package.json.',
        ]);
    });

    it('fixes types', async () => {
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ name: '@trezor/example', types: './lib/index.d.ts' }),
        );

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8'))).toEqual({
            name: '@trezor/example',
            types: './libDev/src/index.d.ts',
        });
    });

    it('uses the Suite application declaration entry', async () => {
        context = {
            ...context,
            workspaceName: '@trezor/suite',
        };
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ types: './libDev/src/index.d.ts' }),
        );

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8'))).toEqual({
            types: './libDev/index.d.ts',
        });
    });

    it('reports missing or invalid package.json', async () => {
        const errorsWithoutFile = await requirePackageJsonTypes.verify(context);

        expect(errorsWithoutFile).toEqual([
            '@trezor/example: package.json is missing or contains invalid JSON.',
        ]);

        writeFileSync(join(workspaceDir, 'package.json'), '{ invalid json }');

        const errorsInvalidJson = await requirePackageJsonTypes.verify(context);

        expect(errorsInvalidJson).toEqual([
            '@trezor/example: package.json is missing or contains invalid JSON.',
        ]);
    });

    it('has workspace scope', () => {
        expect(requirePackageJsonTypes.scope).toBe('workspace');
    });

    it('ignores configured packages', async () => {
        context = {
            ...context,
            workspaceName: 'connect-example-node',
        };

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([]);
    });

    it('does not add types for ignored packages in fix', async () => {
        context = {
            ...context,
            workspaceName: 'connect-mobile-example',
        };

        writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify({ name: 'example' }));

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8'))).toEqual({
            name: 'example',
        });
    });
});

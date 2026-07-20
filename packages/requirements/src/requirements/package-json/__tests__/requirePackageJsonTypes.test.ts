import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
        mkdirSync(join(workspaceDir, 'src'));
        writeFileSync(join(workspaceDir, 'src/index.ts'), 'export {};\n');
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

    it('accepts a conventional TSX entry', async () => {
        rmSync(join(workspaceDir, 'src/index.ts'));
        writeFileSync(join(workspaceDir, 'src/index.tsx'), 'export {};\n');
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ types: './libDev/src/index.d.ts' }),
        );

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([]);
    });

    it('does not invent an entry for an unclassified workspace', async () => {
        rmSync(join(workspaceDir, 'src'), { recursive: true });
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ name: '@trezor/example' }),
        );

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([
            '@trezor/example: workspace without src/index.ts(x) must configure a declaration entry or exemption.',
        ]);
        expect(JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8'))).toEqual({
            name: '@trezor/example',
        });
    });

    it.each([
        ['@trezor/analytics-log-server', './libDev/index.d.ts'],
        ['@trezor/connect-web', './libDev/connect-web/src/index.d.ts'],
        ['@trezor/eslint', './libDev/src/index.d.mts'],
        ['@trezor/suite', './libDev/index.d.ts'],
    ])('uses the declaration entry emitted by %s', async (workspaceName, types) => {
        context = {
            ...context,
            workspaceName,
        };
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ types: './libDev/src/index.d.ts' }),
        );

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8'))).toEqual({
            types,
        });
    });

    it.each([
        [
            '@suite-common/earn-stablecoin',
            {
                './src/allowance': {
                    types: './libDev/src/allowance/index.d.ts',
                    default: './src/allowance/index.ts',
                },
                './src/signing': {
                    types: './libDev/src/signing/index.d.ts',
                    default: './src/signing/index.ts',
                },
                './src/tx-simulation': {
                    types: './libDev/src/tx-simulation/index.d.ts',
                    default: './src/tx-simulation/index.ts',
                },
            },
        ],
        [
            '@suite-common/schemas',
            {
                './src/evm': {
                    types: './libDev/src/evm/index.d.ts',
                    default: './src/evm/index.ts',
                },
            },
        ],
        [
            '@suite/tx-simulation',
            {
                './src/common': {
                    types: './libDev/src/common/index.d.ts',
                    default: './src/common/index.ts',
                },
                './src/evm': {
                    types: './libDev/src/evm/index.d.ts',
                    default: './src/evm/index.ts',
                },
            },
        ],
    ])('configures the typed public subpaths exposed by %s', async (workspaceName, exports) => {
        context = {
            ...context,
            workspaceName,
        };
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ name: workspaceName, types: './libDev/src/index.d.ts' }),
        );

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8'))).toEqual({
            name: workspaceName,
            exports,
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

    it('does not require types for workspaces without a typed package root', async () => {
        context = {
            ...context,
            workspaceName: '@trezor/analytics-docs',
        };

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([]);
    });

    it('removes types from workspaces without a typed package root', async () => {
        context = {
            ...context,
            workspaceName: '@suite-native/app',
        };

        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ name: '@suite-native/app', types: './libDev/src/index.d.ts' }),
        );

        const verificationErrors = await requirePackageJsonTypes.verify(context);

        expect(verificationErrors).toEqual([
            '@suite-native/app: types must be omitted because the workspace does not expose a typed package root in package.json.',
        ]);

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8'))).toEqual({
            name: '@suite-native/app',
        });
    });
});

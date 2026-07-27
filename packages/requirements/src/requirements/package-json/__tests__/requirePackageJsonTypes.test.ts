import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { WorkspaceContext } from '../../Requirement';
import { requirePackageJsonTypes } from '../requirePackageJsonTypes';

const createTempWorkspace = (): string => mkdtempSync(join(tmpdir(), 'package-json-types-'));

describe(requirePackageJsonTypes.name, () => {
    let workspaceDir: string;
    let context: WorkspaceContext;

    const writePackageJson = (packageJson: Record<string, unknown>) =>
        writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify(packageJson));

    const readPackageJson = () =>
        JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8')) as Record<
            string,
            unknown
        >;

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
        writePackageJson({ types: './libDev/src/index.d.ts' });

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports missing or invalid types', async () => {
        writePackageJson({ name: '@trezor/example', types: './lib/index.d.ts' });

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([
            '@trezor/example: types must be "./libDev/src/index.d.ts" in package.json.',
        ]);
    });

    it('fixes types', async () => {
        writePackageJson({ name: '@trezor/example', types: './lib/index.d.ts' });

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(readPackageJson()).toEqual({
            name: '@trezor/example',
            types: './libDev/src/index.d.ts',
        });
    });

    it('accepts a conventional TSX entry', async () => {
        rmSync(join(workspaceDir, 'src/index.ts'));
        writeFileSync(join(workspaceDir, 'src/index.tsx'), 'export {};\n');
        writePackageJson({ types: './libDev/src/index.d.ts' });

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([]);
    });

    it('does not invent an entry for an unclassified workspace', async () => {
        rmSync(join(workspaceDir, 'src'), { recursive: true });
        writePackageJson({ name: '@trezor/example' });

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([
            '@trezor/example: workspace without src/index.ts(x) must configure a declaration entry or exemption.',
        ]);
        expect(readPackageJson()).toEqual({ name: '@trezor/example' });
    });

    it.each([
        ['@trezor/analytics-log-server', './libDev/index.d.ts'],
        ['@trezor/connect-web', './libDev/connect-web/src/index.d.ts'],
        ['@trezor/eslint', './libDev/src/index.d.mts'],
        ['@trezor/suite', './libDev/index.d.ts'],
        ['@trezor/suite-desktop-api', './libDev/src/types.d.ts'],
    ])('uses the declaration entry emitted by %s', async (workspaceName, types) => {
        context = { ...context, workspaceName };
        writePackageJson({ types: './libDev/src/index.d.ts' });

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(readPackageJson()).toMatchObject({ types });
    });

    it('configures a root and typed subpaths together', async () => {
        context = { ...context, workspaceName: '@suite-common/test-utils' };
        writePackageJson({
            name: '@suite-common/test-utils',
            exports: {
                '.': './src/index.ts',
            },
        });

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(readPackageJson()).toEqual({
            name: '@suite-common/test-utils',
            types: './libDev/src/index.d.ts',
            exports: {
                '.': {
                    types: './libDev/src/index.d.ts',
                    default: './src/index.ts',
                },
                './globalOverrides': {
                    types: './libDev/globalOverrides/index.d.ts',
                    default: './globalOverrides/index.ts',
                },
            },
        });
    });

    it('configures React Query provider entries', async () => {
        context = { ...context, workspaceName: '@suite-common/react-query' };
        writePackageJson({ name: '@suite-common/react-query' });

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(readPackageJson()).toMatchObject({
            types: './libDev/src/index.d.ts',
            exports: {
                './react': {
                    types: './libDev/react/index.d.ts',
                    default: './react/index.ts',
                },
                './react-native': {
                    types: './libDev/react-native/index.d.ts',
                    default: './react-native/index.ts',
                },
            },
        });
    });

    it('configures typed exports that would otherwise shadow network declarations', async () => {
        context = { ...context, workspaceName: '@trezor/network-cardano' };
        writePackageJson({
            name: '@trezor/network-cardano',
            exports: {
                './constants': './src/constants/index.ts',
                './runtime': './src/runtime/index.ts',
                './types': './src/types/index.ts',
                '.': './src/index.ts',
            },
        });

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(readPackageJson()).toMatchObject({
            types: './libDev/src/index.d.ts',
            exports: {
                './constants': {
                    types: './libDev/src/constants/index.d.ts',
                    default: './src/constants/index.ts',
                },
                '.': {
                    types: './libDev/src/index.d.ts',
                    default: './src/index.ts',
                },
            },
        });
    });

    it('configures the Tron network declaration entries', async () => {
        context = { ...context, workspaceName: '@trezor/network-tron' };
        writePackageJson({
            name: '@trezor/network-tron',
            exports: {
                './constants': './src/constants/index.ts',
                './utils': './src/utils/index.ts',
                '.': './src/index.ts',
            },
        });

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(readPackageJson()).toMatchObject({
            types: './libDev/src/index.d.ts',
            exports: {
                './constants': {
                    types: './libDev/src/constants/index.d.ts',
                    default: './src/constants/index.ts',
                },
                './utils': {
                    types: './libDev/src/utils/index.d.ts',
                    default: './src/utils/index.ts',
                },
                '.': {
                    types: './libDev/src/index.d.ts',
                    default: './src/index.ts',
                },
            },
        });
    });

    it('reports a root export that shadows an unmodeled declaration entry', async () => {
        writePackageJson({
            types: './libDev/src/index.d.ts',
            exports: { '.': './src/index.ts' },
        });

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([
            '@trezor/example: exports["."] shadows the types field and must configure a typed root export contract.',
        ]);
    });

    it('reports extensionless export declaration targets', async () => {
        context = { ...context, workspaceName: '@trezor/blockchain-link' };
        writePackageJson({
            types: './libDev/src/index.d.ts',
            exports: {
                '.': {
                    types: './libDev/src/index.d.ts',
                    default: './src/index.ts',
                },
                './src/*': {
                    types: './libDev/src/*',
                    default: './src/*',
                },
            },
        });

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toContain(
            '@trezor/blockchain-link: exports["./src/*"].types must target a declaration file with an explicit extension in package.json.',
        );
    });

    it('configures exact Blockchain Link legacy worker entries', async () => {
        context = { ...context, workspaceName: '@trezor/blockchain-link' };
        writePackageJson({ name: '@trezor/blockchain-link' });

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(readPackageJson()).toMatchObject({
            exports: {
                './src/workers/blockbook': {
                    types: './libDev/src/workers/blockbook/index.d.ts',
                    default: './src/workers/blockbook/index.ts',
                },
                './src/workers/blockbook/websocket': {
                    types: './libDev/src/workers/blockbook/websocket.d.ts',
                    default: './src/workers/blockbook/websocket.ts',
                },
                './src/workers/blockfrost': {
                    types: './libDev/src/workers/blockfrost/index.d.ts',
                    default: './src/workers/blockfrost/index.ts',
                },
                './src/workers/ripple': {
                    types: './libDev/src/workers/ripple/index.d.ts',
                    default: './src/workers/ripple/index.ts',
                },
                './src/utils/socks-proxy-agent.ts': {
                    types: './libDev/src/utils/socks-proxy-agent.d.ts',
                    default: './src/utils/socks-proxy-agent.ts',
                },
            },
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
    ])(
        'configures the typed-only public subpaths exposed by %s',
        async (workspaceName, exports) => {
            context = { ...context, workspaceName };
            rmSync(join(workspaceDir, 'src'), { recursive: true });
            writePackageJson({
                name: workspaceName,
                types: './libDev/src/index.d.ts',
            });

            const errors = await requirePackageJsonTypes.fix!(context);

            expect(errors).toEqual([]);
            expect(readPackageJson()).toEqual({ name: workspaceName, exports });
        },
    );

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

    it('does not require types for exempt workspaces', async () => {
        context = { ...context, workspaceName: '@trezor/analytics-docs' };
        writePackageJson({ name: '@trezor/analytics-docs' });

        const errors = await requirePackageJsonTypes.verify(context);

        expect(errors).toEqual([]);
    });

    it('removes types from exempt workspaces', async () => {
        context = { ...context, workspaceName: '@suite-native/app' };
        writePackageJson({
            name: '@suite-native/app',
            types: './libDev/src/index.d.ts',
        });

        const verificationErrors = await requirePackageJsonTypes.verify(context);

        expect(verificationErrors).toEqual([
            '@suite-native/app: types must be omitted because the workspace does not expose a typed package root in package.json.',
        ]);

        const errors = await requirePackageJsonTypes.fix!(context);

        expect(errors).toEqual([]);
        expect(readPackageJson()).toEqual({ name: '@suite-native/app' });
    });

    it('has workspace scope', () => {
        expect(requirePackageJsonTypes.scope).toBe('workspace');
    });
});

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

jest.mock('node:child_process');

import type { RepoContext } from '../Requirement';
import { requireConnectClosureUnifiedFields } from './requireConnectClosureUnifiedFields';

const RELEASE = {
    version: '10.0.1',
    repository: { type: 'git', url: 'git://github.com/trezor/trezor-suite.git' },
    bugs: { url: 'https://github.com/trezor/trezor-suite/issues' },
    author: 'Trezor <info@trezor.io>',
};

const WORKSPACES = [
    { location: 'packages/connect', name: '@trezor/connect', dependencies: ['@trezor/utils'] },
    { location: 'packages/connect-web', name: '@trezor/connect-web', dependencies: [] },
    { location: 'packages/connect-mobile', name: '@trezor/connect-mobile', dependencies: [] },
    {
        location: 'packages/connect-webextension',
        name: '@trezor/connect-webextension',
        dependencies: [],
    },
    { location: 'packages/utils', name: '@trezor/utils', dependencies: [] },
];

describe(requireConnectClosureUnifiedFields.name, () => {
    let context: RepoContext;

    const writePackage = (location: string, json: Record<string, unknown>) => {
        mkdirSync(join(context.repoRoot, location), { recursive: true });
        writeFileSync(join(context.repoRoot, location, 'package.json'), JSON.stringify(json));
    };
    const readPackage = (location: string) =>
        JSON.parse(readFileSync(join(context.repoRoot, location, 'package.json'), 'utf-8'));

    beforeEach(() => {
        context = { repoRoot: mkdtempSync(join(tmpdir(), 'connect-closure-fields-')) };

        for (const { location, name, dependencies } of WORKSPACES) {
            writePackage(location, {
                name,
                ...RELEASE,
                dependencies: Object.fromEntries(dependencies.map(dep => [dep, 'workspace:*'])),
                devDependencies: { '@trezor/dev-only': 'workspace:*' },
            });
        }
        writePackage('packages/dev-only', { name: '@trezor/dev-only', version: '1.0.0' });

        jest.mocked(execFileSync).mockReturnValue(
            [...WORKSPACES, { location: 'packages/dev-only', name: '@trezor/dev-only' }]
                .map(({ location, name }) => JSON.stringify({ location, name }))
                .join('\n'),
        );
    });

    afterEach(() => {
        rmSync(context.repoRoot, { recursive: true, force: true });
    });

    it('passes when the closure matches @trezor/connect, ignoring dev-only packages', async () => {
        await expect(requireConnectClosureUnifiedFields.verify(context)).resolves.toEqual([]);
    });

    it('reports a closure package that differs from @trezor/connect or lacks the field', async () => {
        writePackage('packages/utils', {
            name: '@trezor/utils',
            ...RELEASE,
            version: '1.0.0',
            repository: undefined,
        });

        const errors = await requireConnectClosureUnifiedFields.verify(context);

        expect(errors).toHaveLength(2);
        expect(errors[0]).toContain('"@trezor/utils" has "version" = "1.0.0"');
        expect(errors[1]).toContain('"@trezor/utils" has no "repository"');
    });

    it('fix writes the values of @trezor/connect', async () => {
        writePackage('packages/utils', { name: '@trezor/utils', version: '10.0.2' });

        await expect(requireConnectClosureUnifiedFields.fix!(context)).resolves.toEqual([]);

        expect(readPackage('packages/utils')).toEqual({ name: '@trezor/utils', ...RELEASE });
        await expect(requireConnectClosureUnifiedFields.verify(context)).resolves.toEqual([]);
    });

    it('errors when a connect root is not a workspace package', async () => {
        jest.mocked(execFileSync).mockReturnValue(
            JSON.stringify({ location: 'packages/connect', name: '@trezor/connect' }),
        );

        const errors = await requireConnectClosureUnifiedFields.verify(context);

        expect(errors).toEqual([
            'Not workspace packages: @trezor/connect-web, @trezor/connect-mobile, @trezor/connect-webextension. Was a Connect root renamed or removed?',
        ]);
    });
});

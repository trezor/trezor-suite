import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

jest.mock('node:child_process');

import type { RepoContext } from '../Requirement';
import { requireConnectClosureUnifiedFields } from './requireConnectClosureUnifiedFields';

type Workspace = {
    readonly location: string;
    readonly json: Record<string, unknown>;
};

const REPO = { type: 'git', url: 'git://github.com/trezor/trezor-suite.git' };
const BUGS = { url: 'https://github.com/trezor/trezor-suite/issues' };
const AUTHOR = 'Trezor <info@trezor.io>';
const CANONICAL = '10.0.0-beta.1';

const setupRepo = (workspaces: ReadonlyArray<Workspace>): RepoContext => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'connect-closure-fields-'));

    const write = (location: string, json: Record<string, unknown>) => {
        const dir = join(repoRoot, location);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'package.json'), `${JSON.stringify(json, null, 4)}\n`);
    };

    write('.', { name: 'trezor-suite', private: true });
    for (const ws of workspaces) write(ws.location, ws.json);

    const list = [
        { location: '.', name: 'trezor-suite' },
        ...workspaces.map(w => ({ location: w.location, name: w.json.name })),
    ]
        .map(w => JSON.stringify(w))
        .join('\n');

    jest.mocked(execFileSync).mockReturnValue(list);

    return { repoRoot };
};

// connect -> {connect-common -> utils} (canonical) + {transport-web -> transport-common} (lagging).
const closure = (transportJson: Record<string, unknown>): ReadonlyArray<Workspace> => [
    {
        location: 'packages/connect',
        json: {
            name: '@trezor/connect',
            version: CANONICAL,
            repository: REPO,
            bugs: BUGS,
            author: AUTHOR,
            license: 'SEE LICENSE IN LICENSE.md',
            dependencies: {
                '@trezor/connect-common': 'workspace:*',
                '@trezor/transport-web': 'workspace:*',
            },
            devDependencies: { '@trezor/unrelated': 'workspace:*' },
        },
    },
    {
        location: 'packages/connect-common',
        json: {
            name: '@trezor/connect-common',
            version: CANONICAL,
            repository: REPO,
            bugs: BUGS,
            author: AUTHOR,
            license: 'MIT', // license legitimately differs across the family — must be ignored
            dependencies: { '@trezor/utils': 'workspace:*' },
        },
    },
    {
        location: 'packages/utils',
        json: {
            name: '@trezor/utils',
            version: CANONICAL,
            repository: REPO,
            bugs: BUGS,
            author: AUTHOR,
        },
    },
    {
        location: 'packages/transport-web',
        json: {
            name: '@trezor/transport-web',
            ...transportJson,
            dependencies: { '@trezor/transport-common': 'workspace:*' },
        },
    },
    {
        location: 'packages/transport-common',
        json: { name: '@trezor/transport-common', ...transportJson },
    },
    // Only a devDependency of connect — outside the prod closure, ignored.
    {
        location: 'packages/unrelated',
        json: { name: '@trezor/unrelated', version: '1.2.3' },
    },
];

const readJson = (context: RepoContext, location: string) =>
    JSON.parse(readFileSync(join(context.repoRoot, location, 'package.json'), 'utf-8'));

const tempRoots: string[] = [];
const remember = (context: RepoContext): RepoContext => {
    tempRoots.push(context.repoRoot);

    return context;
};

afterEach(() => {
    for (const root of tempRoots) rmSync(root, { recursive: true, force: true });
    tempRoots.length = 0;
    jest.clearAllMocks();
});

describe(requireConnectClosureUnifiedFields.name, () => {
    it('has repo scope', () => {
        expect(requireConnectClosureUnifiedFields.scope).toBe('repo');
    });

    const UNIFIED = { version: CANONICAL, repository: REPO, bugs: BUGS, author: AUTHOR };

    it('passes when every field is unified across the closure', async () => {
        const context = remember(setupRepo(closure(UNIFIED)));

        expect(await requireConnectClosureUnifiedFields.verify(context)).toEqual([]);
    });

    it('flags a version left behind (the #30575 scenario)', async () => {
        const context = remember(setupRepo(closure({ ...UNIFIED, version: '1.0.0-alpha.1' })));

        const errors = await requireConnectClosureUnifiedFields.verify(context);
        const versionErrors = errors.filter(e => e.includes('"version"'));

        expect(versionErrors).toHaveLength(2);
        expect(versionErrors.join('\n')).toContain('@trezor/transport-web');
        expect(versionErrors.join('\n')).toContain(CANONICAL);
    });

    it('flags missing repository / bugs / author fields (the #30591 scenario)', async () => {
        const context = remember(setupRepo(closure({ version: CANONICAL })));

        const errors = await requireConnectClosureUnifiedFields.verify(context);

        for (const field of ['repository', 'bugs', 'author']) {
            const missing = errors.filter(e => e.includes(`no "${field}" field`));
            expect(missing).toHaveLength(2);
            expect(missing.join('\n')).toContain('@trezor/transport-web');
            expect(missing.join('\n')).toContain('@trezor/transport-common');
        }
    });

    it('ignores fields that legitimately vary (license)', async () => {
        const context = remember(setupRepo(closure(UNIFIED)));

        const errors = await requireConnectClosureUnifiedFields.verify(context);

        // connect is "SEE LICENSE IN LICENSE.md", connect-common is "MIT" — not flagged.
        expect(errors).toEqual([]);
    });

    it('ignores packages outside the production closure', async () => {
        const context = remember(setupRepo(closure({ version: '1.0.0-alpha.1' })));

        const errors = await requireConnectClosureUnifiedFields.verify(context);

        expect(errors.join('\n')).not.toContain('@trezor/unrelated');
    });

    it('errors when no Connect closure root is present', async () => {
        const context = remember(
            setupRepo([
                { location: 'packages/utils', json: { name: '@trezor/utils', version: CANONICAL } },
            ]),
        );

        const errors = await requireConnectClosureUnifiedFields.verify(context);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('No Connect closure packages found');
    });

    describe('fix mode', () => {
        it('aligns version and fills missing repository / bugs / author per package', async () => {
            const context = remember(setupRepo(closure({ version: '1.0.0-alpha.1' })));

            const errors = await requireConnectClosureUnifiedFields.fix!(context);
            expect(errors).toEqual([]);

            for (const location of ['packages/transport-web', 'packages/transport-common']) {
                const pkg = readJson(context, location);
                expect(pkg.version).toBe(CANONICAL);
                expect(pkg.repository).toEqual(REPO);
                expect(pkg.bugs).toEqual(BUGS);
                expect(pkg.author).toBe(AUTHOR);
            }

            expect(await requireConnectClosureUnifiedFields.verify(context)).toEqual([]);
        });

        it('does not touch packages outside the closure', async () => {
            const context = remember(setupRepo(closure({ version: '1.0.0-alpha.1' })));

            await requireConnectClosureUnifiedFields.fix!(context);

            expect(readJson(context, 'packages/unrelated').version).toBe('1.2.3');
        });
    });
});

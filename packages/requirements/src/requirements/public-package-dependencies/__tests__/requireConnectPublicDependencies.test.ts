import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

jest.mock('node:child_process');

import type { RepoContext } from '../../Requirement';
import { requireConnectPublicDependencies } from '../requireConnectPublicDependencies';

const createTempRepo = () => mkdtempSync(join(tmpdir(), 'connect-public-deps-'));

const writePackageJson = (dirPath: string, content: object) => {
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, 'package.json'), `${JSON.stringify(content, null, 2)}\n`);
};

const createRepoFixture = (repoRoot: string) => {
    writePackageJson(repoRoot, {
        name: 'trezor-suite',
        private: true,
        workspaces: {
            packages: ['packages/*'],
        },
    });

    writePackageJson(join(repoRoot, 'packages', 'connect-web'), {
        name: '@trezor/connect-web',
        dependencies: {
            '@trezor/connect-common': 'workspace:*',
            '@trezor/internal-prod': 'workspace:*',
        },
        devDependencies: {
            '@trezor/internal-dev': 'workspace:*',
            'dev-only-external': '^1.0.0',
        },
        peerDependencies: {
            'peer-shared': '^2.0.0',
        },
    });

    writePackageJson(join(repoRoot, 'packages', 'connect-mobile'), {
        name: '@trezor/connect-mobile',
        dependencies: {
            '@trezor/connect-common': 'workspace:*',
            '@trezor/internal-prod': 'workspace:*',
        },
        devDependencies: {
            '@trezor/internal-dev': 'workspace:*',
        },
        peerDependencies: {
            'peer-shared': '^2.0.0',
        },
    });

    writePackageJson(join(repoRoot, 'packages', 'connect-webextension'), {
        name: '@trezor/connect-webextension',
        dependencies: {
            '@trezor/connect-web': 'workspace:*',
            '@trezor/connect-common': 'workspace:*',
        },
        devDependencies: {
            '@trezor/internal-dev': 'workspace:*',
        },
        peerDependencies: {
            'peer-shared': '^2.0.0',
        },
    });

    writePackageJson(join(repoRoot, 'packages', 'connect-common'), {
        name: '@trezor/connect-common',
        dependencies: {
            '@trezor/internal-prod': 'workspace:*',
        },
        peerDependencies: {
            tslib: '^2.0.0',
        },
    });

    writePackageJson(join(repoRoot, 'packages', 'internal-prod'), {
        name: '@trezor/internal-prod',
        dependencies: {
            'prod-only-external': '^1.0.0',
        },
    });

    writePackageJson(join(repoRoot, 'packages', 'internal-dev'), {
        name: '@trezor/internal-dev',
        dependencies: {
            'dev-transitive-external': '^3.0.0',
        },
    });
};

describe(requireConnectPublicDependencies.name, () => {
    let repoRoot: string;
    let context: RepoContext;

    beforeEach(() => {
        repoRoot = createTempRepo();
        context = { repoRoot };
        createRepoFixture(repoRoot);

        const workspaceList = [
            { location: '.', name: 'trezor-suite' },
            { location: 'packages/connect-web', name: '@trezor/connect-web' },
            { location: 'packages/connect-mobile', name: '@trezor/connect-mobile' },
            { location: 'packages/connect-webextension', name: '@trezor/connect-webextension' },
            { location: 'packages/connect-common', name: '@trezor/connect-common' },
            { location: 'packages/internal-prod', name: '@trezor/internal-prod' },
            { location: 'packages/internal-dev', name: '@trezor/internal-dev' },
        ]
            .map(w => JSON.stringify(w))
            .join('\n');

        jest.mocked(execFileSync).mockReturnValue(workspaceList);
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    it('fails verify when snapshots are missing', async () => {
        const errors = await requireConnectPublicDependencies.verify(context);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('public-package-dependencies');
    });

    it('fixes snapshots and then verify passes', async () => {
        expect(requireConnectPublicDependencies.fix).toBeDefined();

        const fixErrors = await requireConnectPublicDependencies.fix!(context);
        expect(fixErrors).toEqual([]);

        const verifyErrors = await requireConnectPublicDependencies.verify(context);
        expect(verifyErrors).toEqual([]);

        const connectWebSnapshotPath = join(
            repoRoot,
            'packages/requirements/src/requirements/public-package-dependencies/__snapshots__/connect-web.json',
        );
        const connectWebSnapshot = JSON.parse(readFileSync(connectWebSnapshotPath, 'utf8')) as {
            prod: string[];
            dev: string[];
        };

        expect(connectWebSnapshot.prod).toContain('@trezor/internal-prod');
        expect(connectWebSnapshot.prod).not.toContain('@trezor/internal-dev');
        expect(connectWebSnapshot.dev).toContain('@trezor/internal-dev');

        expect(connectWebSnapshot.prod).toContain('prod-only-external');
        expect(connectWebSnapshot.prod).not.toContain('dev-only-external');
        expect(connectWebSnapshot.dev).toContain('dev-only-external');
        expect(connectWebSnapshot.dev).toContain('dev-transitive-external');

        expect(connectWebSnapshot.prod).toContain('peer-shared');
        expect(connectWebSnapshot.prod).toContain('tslib');
        expect(connectWebSnapshot.dev).toContain('peer-shared');
    });

    it('has repo scope', () => {
        expect(requireConnectPublicDependencies.scope).toBe('repo');
    });
});

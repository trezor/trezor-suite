import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    ALLOWED_DRIFTS,
    requireUnifiedDependencyVersions,
} from '../requireUnifiedDependencyVersions';

// Pick any real entry from ALLOWED_DRIFTS so tests never depend on specific hardcoded names.
const [SOME_ALLOWED_DEP] = ALLOWED_DRIFTS;

const tempDirs: string[] = [];

afterEach(() => {
    for (const dir of tempDirs) {
        rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
});

const createTempRepo = () => {
    const root = mkdtempSync(join(tmpdir(), 'req-dep-test-'));
    tempDirs.push(root);

    return {
        root,
        addWorkspace: (
            name: string,
            location: string,
            deps: Record<string, string> = {},
            devDeps: Record<string, string> = {},
        ) => {
            const dir = join(root, location);
            mkdirSync(dir, { recursive: true });

            const pkg: Record<string, unknown> = { name };

            if (Object.keys(deps).length > 0) {
                pkg.dependencies = deps;
            }

            if (Object.keys(devDeps).length > 0) {
                pkg.devDependencies = devDeps;
            }

            writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 4) + '\n');
        },
        setRootPackageJson: (
            workspaces: string[],
            deps: Record<string, string> = {},
            devDeps: Record<string, string> = {},
            resolutions: Record<string, string> = {},
        ) => {
            const pkg: Record<string, unknown> = {
                name: 'test-monorepo',
                workspaces: { packages: workspaces },
            };

            if (Object.keys(deps).length > 0) {
                pkg.dependencies = deps;
            }

            if (Object.keys(devDeps).length > 0) {
                pkg.devDependencies = devDeps;
            }
            if (Object.keys(resolutions).length > 0) {
                pkg.resolutions = resolutions;
            }

            writeFileSync(join(root, 'package.json'), JSON.stringify(pkg, null, 4) + '\n');
        },
    };
};

describe('requireUnifiedDependencyVersions', () => {
    it('createTempRepo creates expected root and workspace package.json files', () => {
        const repo = createTempRepo();

        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.21' });
        repo.addWorkspace('@test/beta', 'packages/beta', { lodash: '^4.17.21' });

        const rootPkg = JSON.parse(readFileSync(join(repo.root, 'package.json'), 'utf-8'));
        const alphaPkg = JSON.parse(
            readFileSync(join(repo.root, 'packages/alpha/package.json'), 'utf-8'),
        );
        const betaPkg = JSON.parse(
            readFileSync(join(repo.root, 'packages/beta/package.json'), 'utf-8'),
        );

        expect(rootPkg.workspaces).toEqual({ packages: ['packages/*'] });
        expect(alphaPkg.name).toBe('@test/alpha');
        expect(alphaPkg.dependencies).toEqual({ lodash: '^4.17.21' });
        expect(betaPkg.name).toBe('@test/beta');
        expect(betaPkg.dependencies).toEqual({ lodash: '^4.17.21' });
    });

    it('reports no errors when all versions match', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.21' });
        repo.addWorkspace('@test/beta', 'packages/beta', { lodash: '^4.17.21' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toEqual([]);
    });

    it('ignores dependencies in the allowed drifts list', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', { [SOME_ALLOWED_DEP]: '1.0.0' });
        repo.addWorkspace('@test/beta', 'packages/beta', { [SOME_ALLOWED_DEP]: '2.0.0' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toEqual([]);
    });

    it('reports errors when versions differ', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.15' });
        repo.addWorkspace('@test/beta', 'packages/beta', { lodash: '^4.17.21' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('"lodash"');
        expect(errors[0]).toContain('^4.17.15');
        expect(errors[0]).toContain('^4.17.21');
    });

    it('reports errors across dependencies and devDependencies', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', { express: '4.18.0' });
        repo.addWorkspace('@test/beta', 'packages/beta', {}, { express: '^4.17.0' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('"express"');
    });

    it('ignores workspace: protocol references', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', { '@test/beta': 'workspace:*' });
        repo.addWorkspace('@test/beta', 'packages/beta', { '@test/alpha': 'workspace:^' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toEqual([]);
    });

    it('ignores git/file/link references', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', {
            'some-pkg': 'github:user/repo#v1',
        });
        repo.addWorkspace('@test/beta', 'packages/beta', {
            'some-pkg': 'github:user/repo#v2',
        });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toEqual([]);
    });

    it('reports no error when a dependency is used in only one workspace', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.21' });
        repo.addWorkspace('@test/beta', 'packages/beta', { express: '^4.18.0' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toEqual([]);
    });

    it('reports multiple drifted dependencies', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        repo.addWorkspace('@test/alpha', 'packages/alpha', {
            lodash: '^4.17.15',
            express: '4.18.0',
        });
        repo.addWorkspace('@test/beta', 'packages/beta', {
            lodash: '^4.17.21',
            express: '4.19.0',
        });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toHaveLength(2);
    });

    it('detects drift between root package.json and workspace', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*'], { lodash: '^4.17.15' });
        repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.21' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('"lodash"');
        expect(errors[0]).toContain('test-monorepo');
        expect(errors[0]).toContain('^4.17.15');
        expect(errors[0]).toContain('^4.17.21');
    });

    it('supports flat workspaces array', async () => {
        const repo = createTempRepo();
        // Use flat array format instead of { packages: [...] }
        writeFileSync(
            join(repo.root, 'package.json'),
            JSON.stringify({ name: 'test-monorepo', workspaces: ['packages/*'] }, null, 4) + '\n',
        );
        repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.15' });
        repo.addWorkspace('@test/beta', 'packages/beta', { lodash: '^4.17.21' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toHaveLength(1);
    });

    it('detects drift between root package.json resolutions and workspace dependency', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*'], {}, {}, { lodash: '4.17.15' });
        repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.21' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('"lodash"');
        expect(errors[0]).toContain('4.17.15');
        expect(errors[0]).toContain('^4.17.21');
        expect(errors[0]).toContain('resolutions');
    });

    it('reports error when ALLOWED_DRIFTS entry has unified versions', async () => {
        const repo = createTempRepo();
        repo.setRootPackageJson(['packages/*']);
        // SOME_ALLOWED_DEP is in ALLOWED_DRIFTS but has the same version everywhere — stale
        repo.addWorkspace('@test/alpha', 'packages/alpha', { [SOME_ALLOWED_DEP]: '1.0.0' });
        repo.addWorkspace('@test/beta', 'packages/beta', { [SOME_ALLOWED_DEP]: '1.0.0' });

        const errors = await requireUnifiedDependencyVersions.verify({ repoRoot: repo.root });

        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain(`"${SOME_ALLOWED_DEP}"`);
        expect(errors[0]).toContain('ALLOWED_DRIFTS');
    });

    describe('fix mode', () => {
        it('aligns all versions to the most common one', async () => {
            const repo = createTempRepo();
            repo.setRootPackageJson(['packages/*']);
            repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.21' });
            repo.addWorkspace('@test/beta', 'packages/beta', { lodash: '^4.17.21' });
            repo.addWorkspace('@test/gamma', 'packages/gamma', { lodash: '^4.17.15' });

            const errors = await requireUnifiedDependencyVersions.fix!({ repoRoot: repo.root });

            expect(errors).toEqual([]);

            // Verify the file was updated
            const gammaPkg = JSON.parse(
                readFileSync(join(repo.root, 'packages/gamma/package.json'), 'utf-8'),
            );
            expect(gammaPkg.dependencies.lodash).toBe('^4.17.21');
        });

        it('picks numerically higher version when frequencies are tied', async () => {
            const repo = createTempRepo();
            repo.setRootPackageJson(['packages/*']);
            // Both versions appear once - tie-break should prefer ^10.2.0 over ^9.5.0
            repo.addWorkspace('@test/alpha', 'packages/alpha', { meow_lib: '^9.5.0' });
            repo.addWorkspace('@test/beta', 'packages/beta', { meow_lib: '^10.2.0' });

            const errors = await requireUnifiedDependencyVersions.fix!({ repoRoot: repo.root });

            expect(errors).toEqual([]);

            const alphaPkg = JSON.parse(
                readFileSync(join(repo.root, 'packages/alpha/package.json'), 'utf-8'),
            );
            expect(alphaPkg.dependencies.meow_lib).toBe('^10.2.0');
        });

        it('fixes drift between root package.json and workspace', async () => {
            const repo = createTempRepo();
            // Root has one version, two workspaces have another — workspace version wins by frequency
            repo.setRootPackageJson(['packages/*'], { lodash: '^4.17.15' });
            repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.21' });
            repo.addWorkspace('@test/beta', 'packages/beta', { lodash: '^4.17.21' });

            const errors = await requireUnifiedDependencyVersions.fix!({ repoRoot: repo.root });

            expect(errors).toEqual([]);

            // Verify the root was updated
            const rootPkg = JSON.parse(readFileSync(join(repo.root, 'package.json'), 'utf-8'));
            expect(rootPkg.dependencies.lodash).toBe('^4.17.21');
        });

        it('returns no errors when there are no drifts', async () => {
            const repo = createTempRepo();
            repo.setRootPackageJson(['packages/*']);
            repo.addWorkspace('@test/alpha', 'packages/alpha', { lodash: '^4.17.21' });
            repo.addWorkspace('@test/beta', 'packages/beta', { lodash: '^4.17.21' });

            const errors = await requireUnifiedDependencyVersions.fix!({ repoRoot: repo.root });

            expect(errors).toEqual([]);
        });

        it('reports stale ALLOWED_DRIFTS entries that cannot be auto-fixed', async () => {
            const repo = createTempRepo();
            repo.setRootPackageJson(['packages/*']);
            // SOME_ALLOWED_DEP is in ALLOWED_DRIFTS but has unified versions — stale entry
            repo.addWorkspace('@test/alpha', 'packages/alpha', { [SOME_ALLOWED_DEP]: '1.0.0' });
            repo.addWorkspace('@test/beta', 'packages/beta', { [SOME_ALLOWED_DEP]: '1.0.0' });

            const errors = await requireUnifiedDependencyVersions.fix!({ repoRoot: repo.root });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain(`"${SOME_ALLOWED_DEP}"`);
            expect(errors[0]).toContain('ALLOWED_DRIFTS');
        });
    });
});

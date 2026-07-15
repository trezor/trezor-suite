import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { listAllWorkspaces } from '../../../workspaces';
import { requireEasWorkspaceUpload } from '../requireEasWorkspaceUpload';

jest.mock('../../../workspaces', () => ({
    ...jest.requireActual('../../../workspaces'),
    listAllWorkspaces: jest.fn(),
}));

const mockedListAllWorkspaces = jest.mocked(listAllWorkspaces);

const GENERATED_BLOCK_START = '# BEGIN requirements:eas-workspaces';
const GENERATED_BLOCK_END = '# END requirements:eas-workspaces';

type PackageJson = {
    readonly name: string;
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
    readonly optionalDependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
};

const createEasIgnore = (ignoredWorkspacePaths: ReadonlyArray<string>): string =>
    [
        '# Existing rules.',
        GENERATED_BLOCK_START,
        ...ignoredWorkspacePaths,
        GENERATED_BLOCK_END,
        '',
        'node_modules',
        '',
    ].join('\n');

describe(requireEasWorkspaceUpload.name, () => {
    let repoRoot: string;
    const workspaces: Array<{ readonly dir: string; readonly name: string }> = [];

    const addWorkspace = (location: string, packageJson: PackageJson) => {
        const workspaceDir = join(repoRoot, location);
        mkdirSync(workspaceDir, { recursive: true });
        writeFileSync(
            join(workspaceDir, 'package.json'),
            `${JSON.stringify(packageJson, null, 4)}\n`,
        );
        workspaces.push({ dir: workspaceDir, name: packageJson.name });
    };

    beforeEach(() => {
        repoRoot = mkdtempSync(join(tmpdir(), 'eas-workspace-upload-'));
        workspaces.length = 0;
        mockedListAllWorkspaces.mockImplementation(() => workspaces);

        writeFileSync(
            join(repoRoot, 'package.json'),
            `${JSON.stringify(
                {
                    name: 'test-monorepo',
                    dependencies: { '@test/root-tool': 'workspace:*' },
                },
                null,
                4,
            )}\n`,
        );
        addWorkspace('suite-native/app', {
            name: '@suite-native/app',
            dependencies: { '@test/native-dependency': 'workspace:*' },
        });
        addWorkspace('packages/native-dependency', {
            name: '@test/native-dependency',
            optionalDependencies: { '@test/transitive-dependency': 'workspace:^' },
        });
        addWorkspace('packages/transitive-dependency', {
            name: '@test/transitive-dependency',
        });
        addWorkspace('packages/root-tool', { name: '@test/root-tool' });
        addWorkspace('packages/unrelated', { name: '@test/unrelated' });
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
        jest.clearAllMocks();
    });

    it('passes when only workspaces outside the native and root dependency closures are ignored', async () => {
        writeFileSync(
            join(repoRoot, '.easignore'),
            createEasIgnore(['packages/unrelated/', 'suite/']),
        );

        const errors = await requireEasWorkspaceUpload.verify({ repoRoot });

        expect(errors).toEqual([]);
    });

    it('reports an unrelated workspace missing from the generated ignore block', async () => {
        writeFileSync(join(repoRoot, '.easignore'), createEasIgnore([]));

        const errors = await requireEasWorkspaceUpload.verify({ repoRoot });

        expect(errors).toContain(
            'The generated EAS workspace block is outdated. Run `yarn requirements:fix --only=eas-workspace-upload`.',
        );
    });

    it('reports a required workspace ignored outside the generated block', async () => {
        writeFileSync(
            join(repoRoot, '.easignore'),
            `${createEasIgnore(['packages/unrelated/', 'suite/'])}packages/native-dependency/\n`,
        );

        const errors = await requireEasWorkspaceUpload.verify({ repoRoot });

        expect(errors).toContain(
            'Required EAS workspace @test/native-dependency (packages/native-dependency) is excluded by .easignore.',
        );
    });

    it('reports an uploaded workspace whose workspace dependency is excluded', async () => {
        addWorkspace('packages/uploaded', {
            name: '@test/uploaded',
            devDependencies: { '@test/unrelated': 'workspace:~' },
        });
        writeFileSync(
            join(repoRoot, '.easignore'),
            `${createEasIgnore([
                'packages/unrelated/',
                'packages/uploaded/',
                'suite/',
            ])}!packages/uploaded/\n`,
        );

        const errors = await requireEasWorkspaceUpload.verify({ repoRoot });

        expect(errors).toContain(
            'Uploaded EAS workspace @test/uploaded (packages/uploaded) depends on excluded workspace @test/unrelated (packages/unrelated).',
        );
    });

    it('autofixes the generated block while preserving manual rules', async () => {
        const easIgnorePath = join(repoRoot, '.easignore');
        writeFileSync(
            easIgnorePath,
            [
                '# Existing rules.',
                GENERATED_BLOCK_START,
                'packages/native-dependency/',
                GENERATED_BLOCK_END,
                '',
                'node_modules',
                '',
            ].join('\n'),
        );

        const errors = await requireEasWorkspaceUpload.fix!({ repoRoot });

        expect(errors).toEqual([]);
        expect(readFileSync(easIgnorePath, 'utf-8')).toBe(
            createEasIgnore(['packages/unrelated/', 'suite/']),
        );
    });

    it('adds a missing generated block', async () => {
        const easIgnorePath = join(repoRoot, '.easignore');
        writeFileSync(easIgnorePath, '# Existing rules.\n\nnode_modules\n');

        const errors = await requireEasWorkspaceUpload.fix!({ repoRoot });

        expect(errors).toEqual([]);
        expect(readFileSync(easIgnorePath, 'utf-8')).toBe(
            [
                GENERATED_BLOCK_START,
                'packages/unrelated/',
                'suite/',
                GENERATED_BLOCK_END,
                '',
                '# Existing rules.',
                '',
                'node_modules',
                '',
            ].join('\n'),
        );
    });

    it('collapses permanently excluded suite workspaces into one root rule', async () => {
        addWorkspace('suite/desktop', { name: '@suite/desktop' });
        addWorkspace('suite/web', { name: '@suite/web' });
        const easIgnorePath = join(repoRoot, '.easignore');
        writeFileSync(easIgnorePath, '# Existing rules.\n\nnode_modules\n');

        const errors = await requireEasWorkspaceUpload.fix!({ repoRoot });

        expect(errors).toEqual([]);
        expect(readFileSync(easIgnorePath, 'utf-8')).toBe(
            [
                GENERATED_BLOCK_START,
                'packages/unrelated/',
                'suite/',
                GENERATED_BLOCK_END,
                '',
                '# Existing rules.',
                '',
                'node_modules',
                '',
            ].join('\n'),
        );
    });

    it('does not require an update when a workspace is added under suite', async () => {
        addWorkspace('suite/new-workspace', { name: '@suite/new-workspace' });
        writeFileSync(
            join(repoRoot, '.easignore'),
            createEasIgnore(['packages/unrelated/', 'suite/']),
        );

        const errors = await requireEasWorkspaceUpload.verify({ repoRoot });

        expect(errors).toEqual([]);
    });

    it('reports a native dependency on a permanently excluded suite workspace', async () => {
        addWorkspace('suite/desktop', { name: '@suite/desktop' });
        writeFileSync(
            join(repoRoot, 'suite-native/app/package.json'),
            `${JSON.stringify(
                {
                    name: '@suite-native/app',
                    dependencies: {
                        '@suite/desktop': 'workspace:*',
                        '@test/native-dependency': 'workspace:*',
                    },
                },
                null,
                4,
            )}\n`,
        );
        writeFileSync(
            join(repoRoot, '.easignore'),
            createEasIgnore(['packages/unrelated/', 'suite/']),
        );

        const errors = await requireEasWorkspaceUpload.verify({ repoRoot });

        expect(errors).toContain(
            'Required EAS workspace @suite/desktop (suite/desktop) is inside permanently excluded root suite/.',
        );
    });

    it('has repo scope', () => {
        expect(requireEasWorkspaceUpload.scope).toBe('repo');
    });
});

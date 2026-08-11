import ignore from 'ignore';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { type WorkspaceEntry, listAllWorkspaces, readPackageJson } from '../../workspaces';
import type { RepoContext, Requirement } from '../Requirement';

const EAS_IGNORE_FILE = '.easignore';
const EAS_ENTRY_WORKSPACE_NAME = '@suite-native/app';
const GENERATED_BLOCK_START = '# BEGIN requirements:eas-workspaces';
const GENERATED_BLOCK_END = '# END requirements:eas-workspaces';
const OUTDATED_BLOCK_ERROR =
    'The generated EAS workspace block is outdated. Run `yarn requirements:fix --only=eas-workspace-upload`.';
const PERMANENTLY_EXCLUDED_WORKSPACE_ROOTS = ['suite'] as const;

// Include workspaces accessed by EAS scripts or config through direct filesystem paths.
export const EAS_ALWAYS_INCLUDED_WORKSPACE_NAMES: ReadonlyArray<string> = [];

const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
] as const;

type PackageJson = {
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
    readonly optionalDependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
};

type EasWorkspace = WorkspaceEntry & {
    readonly location: string;
    readonly packageJson: PackageJson;
};

type EasWorkspaceState = {
    readonly errors: ReadonlyArray<string>;
    readonly expectedIgnoredLocations: ReadonlyArray<string>;
    readonly requiredWorkspaceNames: ReadonlySet<string>;
    readonly workspaceByName: ReadonlyMap<string, EasWorkspace>;
    readonly workspaces: ReadonlyArray<EasWorkspace>;
};

type GeneratedBlockIndexes = {
    readonly end: number;
    readonly start: number;
};

const getWorkspaceDependencyNames = (packageJson: PackageJson): ReadonlyArray<string> =>
    DEPENDENCY_FIELDS.flatMap(field =>
        Object.entries(packageJson[field] ?? {})
            .filter(([, specifier]) => specifier.startsWith('workspace:'))
            .map(([name]) => name),
    );

const getWorkspaceLocation = ({ dir }: WorkspaceEntry, repoRoot: string): string =>
    relative(repoRoot, dir).split(sep).join('/');

const getPermanentlyExcludedWorkspaceRoot = (workspaceLocation: string): string | undefined =>
    PERMANENTLY_EXCLUDED_WORKSPACE_ROOTS.find(
        workspaceRoot =>
            workspaceLocation === workspaceRoot ||
            workspaceLocation.startsWith(`${workspaceRoot}/`),
    );

const getGeneratedBlock = (ignoredLocations: ReadonlyArray<string>): string =>
    [
        GENERATED_BLOCK_START,
        ...ignoredLocations.map(location => `${location}/`),
        GENERATED_BLOCK_END,
    ].join('\n');

const getGeneratedBlockIndexes = (
    easIgnoreLines: ReadonlyArray<string>,
): GeneratedBlockIndexes | undefined => {
    const startIndexes = easIgnoreLines.flatMap((line, index) =>
        line === GENERATED_BLOCK_START ? [index] : [],
    );
    const endIndexes = easIgnoreLines.flatMap((line, index) =>
        line === GENERATED_BLOCK_END ? [index] : [],
    );

    if (startIndexes.length === 0 && endIndexes.length === 0) {
        return undefined;
    }

    if (startIndexes.length !== 1 || endIndexes.length !== 1) {
        throw new Error('The generated EAS workspace block markers are malformed.');
    }

    const [start] = startIndexes;
    const [end] = endIndexes;

    if (start === undefined || end === undefined || start >= end) {
        throw new Error('The generated EAS workspace block markers are malformed.');
    }

    return { end, start };
};

const replaceGeneratedBlock = ({
    easIgnoreContent,
    generatedBlock,
}: {
    readonly easIgnoreContent: string;
    readonly generatedBlock: string;
}): string => {
    const lines = easIgnoreContent.split('\n');
    const indexes = getGeneratedBlockIndexes(lines);

    if (indexes === undefined) {
        return easIgnoreContent.length === 0
            ? `${generatedBlock}\n`
            : `${generatedBlock}\n\n${easIgnoreContent}`;
    }

    return [...lines.slice(0, indexes.start), generatedBlock, ...lines.slice(indexes.end + 1)].join(
        '\n',
    );
};

const getEasWorkspaceState = (repoRoot: string): EasWorkspaceState => {
    const workspaces = listAllWorkspaces(repoRoot)
        .map(workspace => ({
            ...workspace,
            location: getWorkspaceLocation(workspace, repoRoot),
            packageJson: readPackageJson<PackageJson>(workspace.dir),
        }))
        .filter(workspace => workspace.location.length > 0);
    const workspaceByName = new Map(workspaces.map(workspace => [workspace.name, workspace]));
    const rootPackageJson = readPackageJson<PackageJson>(repoRoot);
    const pendingWorkspaceNames = [
        EAS_ENTRY_WORKSPACE_NAME,
        ...EAS_ALWAYS_INCLUDED_WORKSPACE_NAMES,
        ...getWorkspaceDependencyNames(rootPackageJson),
    ];
    const requiredWorkspaceNames = new Set<string>();
    const errors: string[] = [];

    while (pendingWorkspaceNames.length > 0) {
        const workspaceName = pendingWorkspaceNames.shift();

        if (workspaceName === undefined || requiredWorkspaceNames.has(workspaceName)) {
            continue;
        }

        const workspace = workspaceByName.get(workspaceName);

        if (workspace === undefined) {
            errors.push(`Required EAS workspace ${workspaceName} does not exist.`);

            continue;
        }

        const permanentlyExcludedRoot = getPermanentlyExcludedWorkspaceRoot(workspace.location);

        if (permanentlyExcludedRoot !== undefined) {
            errors.push(
                `Required EAS workspace ${workspace.name} (${workspace.location}) is inside permanently excluded root ${permanentlyExcludedRoot}/.`,
            );

            continue;
        }

        requiredWorkspaceNames.add(workspaceName);
        pendingWorkspaceNames.push(...getWorkspaceDependencyNames(workspace.packageJson));
    }

    const expectedIgnoredLocations = [
        ...PERMANENTLY_EXCLUDED_WORKSPACE_ROOTS,
        ...workspaces
            .filter(
                workspace =>
                    !requiredWorkspaceNames.has(workspace.name) &&
                    getPermanentlyExcludedWorkspaceRoot(workspace.location) === undefined,
            )
            .map(workspace => workspace.location),
    ].sort();

    return {
        errors,
        expectedIgnoredLocations,
        requiredWorkspaceNames,
        workspaceByName,
        workspaces,
    };
};

const getGeneratedBlockErrors = ({
    easIgnoreContent,
    expectedGeneratedBlock,
}: {
    readonly easIgnoreContent: string;
    readonly expectedGeneratedBlock: string;
}): ReadonlyArray<string> => {
    try {
        const lines = easIgnoreContent.split('\n');
        const indexes = getGeneratedBlockIndexes(lines);

        if (indexes === undefined) {
            return [OUTDATED_BLOCK_ERROR];
        }

        const actualGeneratedBlock = lines.slice(indexes.start, indexes.end + 1).join('\n');

        return actualGeneratedBlock === expectedGeneratedBlock ? [] : [OUTDATED_BLOCK_ERROR];
    } catch (error) {
        return [error instanceof Error ? error.message : String(error)];
    }
};

const getUploadGraphErrors = ({
    easIgnoreContent,
    state,
}: {
    readonly easIgnoreContent: string;
    readonly state: EasWorkspaceState;
}): ReadonlyArray<string> => {
    const errors: string[] = [];
    const easIgnore = ignore().add(easIgnoreContent);
    const isWorkspaceIgnored = (workspace: EasWorkspace) =>
        easIgnore.ignores(`${workspace.location}/package.json`);

    for (const workspace of state.workspaces) {
        if (state.requiredWorkspaceNames.has(workspace.name) && isWorkspaceIgnored(workspace)) {
            errors.push(
                `Required EAS workspace ${workspace.name} (${workspace.location}) is excluded by .easignore.`,
            );
        }

        if (isWorkspaceIgnored(workspace)) {
            continue;
        }

        for (const dependencyName of getWorkspaceDependencyNames(workspace.packageJson)) {
            const dependencyWorkspace = state.workspaceByName.get(dependencyName);

            if (dependencyWorkspace === undefined) {
                errors.push(
                    `Uploaded EAS workspace ${workspace.name} (${workspace.location}) depends on missing workspace ${dependencyName}.`,
                );

                continue;
            }

            if (isWorkspaceIgnored(dependencyWorkspace)) {
                errors.push(
                    `Uploaded EAS workspace ${workspace.name} (${workspace.location}) depends on excluded workspace ${dependencyWorkspace.name} (${dependencyWorkspace.location}).`,
                );
            }
        }
    }

    return errors;
};

const verifyEasWorkspaceUpload = ({ repoRoot }: RepoContext): ReadonlyArray<string> => {
    const easIgnorePath = join(repoRoot, EAS_IGNORE_FILE);

    if (!existsSync(easIgnorePath)) {
        return [`${EAS_IGNORE_FILE} does not exist.`];
    }

    const state = getEasWorkspaceState(repoRoot);
    const easIgnoreContent = readFileSync(easIgnorePath, 'utf-8');
    const expectedGeneratedBlock = getGeneratedBlock(state.expectedIgnoredLocations);

    return [
        ...state.errors,
        ...getGeneratedBlockErrors({ easIgnoreContent, expectedGeneratedBlock }),
        ...getUploadGraphErrors({ easIgnoreContent, state }),
    ];
};

export const requireEasWorkspaceUpload: Requirement<'repo'> = {
    name: 'eas-workspace-upload',
    scope: 'repo',
    verify: context => Promise.resolve(verifyEasWorkspaceUpload(context)),
    fix: context => {
        const easIgnorePath = join(context.repoRoot, EAS_IGNORE_FILE);
        const state = getEasWorkspaceState(context.repoRoot);

        if (state.errors.length > 0) {
            return Promise.resolve(state.errors);
        }

        const easIgnoreContent = existsSync(easIgnorePath)
            ? readFileSync(easIgnorePath, 'utf-8')
            : '';
        const generatedBlock = getGeneratedBlock(state.expectedIgnoredLocations);

        try {
            writeFileSync(
                easIgnorePath,
                replaceGeneratedBlock({ easIgnoreContent, generatedBlock }),
                'utf-8',
            );
        } catch (error) {
            return Promise.resolve([error instanceof Error ? error.message : String(error)]);
        }

        return Promise.resolve(verifyEasWorkspaceUpload(context));
    },
};

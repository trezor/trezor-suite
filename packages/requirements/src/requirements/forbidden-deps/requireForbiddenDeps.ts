import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { typedObjectKeys } from '@trezor/utils';

import type { AllowedOnlyInRule, ForbiddenDepsConfig } from './forbiddenDepsTypes';
import { getWorkspaceDirectoryMap, readPackageJson } from '../../workspaces';
import type { Requirement } from '../Requirement';

const FORBIDDEN_DEPS_CONFIG_FILE = 'forbiddenDeps.config.ts';

const PACKAGE_JSON_FILE = 'package.json';

const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
] as const;

type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

type PackageJson = {
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
    readonly optionalDependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
};

type DependencyOccurrence = {
    readonly field: DependencyField;
    readonly name: string;
};

type WorkspaceDirectories = ReadonlyMap<string, string>;

type WorkspaceDirectoryResolver = (props: {
    readonly repoRoot: string;
    readonly workspaceName: string;
}) => string | undefined;

type ForbiddenDepsConfigLoader = (workspaceDir: string) => Promise<ForbiddenDepsConfig | undefined>;

const collectDependencyOccurrences = (
    packageJson: PackageJson,
): ReadonlyArray<DependencyOccurrence> => {
    const occurrences: DependencyOccurrence[] = [];

    for (const dependencyField of DEPENDENCY_FIELDS) {
        for (const dependencyName of typedObjectKeys(packageJson[dependencyField] ?? {})) {
            occurrences.push({
                field: dependencyField,
                name: dependencyName,
            });
        }
    }

    return occurrences;
};

const createForbiddenDepsMap = (
    forbiddenDeps: NonNullable<ForbiddenDepsConfig['forbidden-deps']>,
) =>
    new Map(
        forbiddenDeps.map(forbiddenDependency => [
            forbiddenDependency.packageName,
            forbiddenDependency,
        ]),
    );

const formatAllowedOnlyInPackages = (allowedOnlyInRule: AllowedOnlyInRule) =>
    allowedOnlyInRule.packages.map(packageName => JSON.stringify(packageName)).join(', ');

const loadForbiddenDepsConfig: ForbiddenDepsConfigLoader = async workspaceDir => {
    const configPath = join(workspaceDir, FORBIDDEN_DEPS_CONFIG_FILE);

    if (!existsSync(configPath)) {
        return undefined;
    }

    const configModule = (await import(pathToFileURL(configPath).href)) as {
        readonly default?: ForbiddenDepsConfig;
        readonly forbiddenDepsConfig?: ForbiddenDepsConfig;
    };

    return configModule.forbiddenDepsConfig ?? configModule.default;
};

const getWorkspaceDirectoryResolver = (repoRoot: string): WorkspaceDirectories =>
    getWorkspaceDirectoryMap(repoRoot);

const getWorkspaceDirectoryByName: WorkspaceDirectoryResolver = ({ repoRoot, workspaceName }) =>
    getWorkspaceDirectoryResolver(repoRoot).get(workspaceName);

type InvalidConfiguredPackagesErrorsParams = {
    readonly dependencyRule: ForbiddenDepsConfig | undefined;
    readonly workspaceDirectories: WorkspaceDirectories;
    readonly workspaceName: string;
};

const getInvalidConfiguredPackagesErrors = ({
    dependencyRule,
    workspaceDirectories,
    workspaceName,
}: InvalidConfiguredPackagesErrorsParams): ReadonlyArray<string> => {
    const errors: string[] = [];

    for (const forbiddenDependency of dependencyRule?.['forbidden-deps'] ?? []) {
        if (workspaceDirectories.has(forbiddenDependency.packageName)) {
            continue;
        }

        errors.push(
            `${workspaceName}: ${JSON.stringify(forbiddenDependency.packageName)} in "forbidden-deps" is not an existing workspace package.`,
        );
    }

    for (const packageName of dependencyRule?.['allowed-only-in']?.packages ?? []) {
        if (workspaceDirectories.has(packageName)) {
            continue;
        }

        errors.push(
            `${workspaceName}: ${JSON.stringify(packageName)} in "allowed-only-in" is not an existing workspace package.`,
        );
    }

    return errors;
};

type ForbiddenDependencyErrorsParams = {
    readonly dependencyOccurrences: ReadonlyArray<DependencyOccurrence>;
    readonly dependencyRule: ForbiddenDepsConfig | undefined;
    readonly workspaceName: string;
};

const getForbiddenDependencyErrors = ({
    dependencyOccurrences,
    dependencyRule,
    workspaceName,
}: ForbiddenDependencyErrorsParams): ReadonlyArray<string> => {
    const forbiddenDepsMap = createForbiddenDepsMap(dependencyRule?.['forbidden-deps'] ?? []);

    return dependencyOccurrences.flatMap(dependencyOccurrence => {
        const forbiddenDependency = forbiddenDepsMap.get(dependencyOccurrence.name);

        if (forbiddenDependency === undefined) {
            return [];
        }

        return [
            `${workspaceName}: ${JSON.stringify(dependencyOccurrence.name)} is forbidden in ${dependencyOccurrence.field}. Reason: ${forbiddenDependency.reason}`,
        ];
    });
};

type AllowedOnlyErrorsParams = {
    readonly dependencyOccurrences: ReadonlyArray<DependencyOccurrence>;
    readonly getWorkspaceDirByName: WorkspaceDirectoryResolver;
    readonly loadConfig: ForbiddenDepsConfigLoader;
    readonly repoRoot: string;
    readonly workspaceName: string;
};

const getAllowedOnlyErrors = async ({
    dependencyOccurrences,
    getWorkspaceDirByName,
    loadConfig,
    repoRoot,
    workspaceName,
}: AllowedOnlyErrorsParams): Promise<ReadonlyArray<string>> => {
    const errors: string[] = [];

    for (const dependencyOccurrence of dependencyOccurrences) {
        const dependencyWorkspaceDir = getWorkspaceDirByName({
            repoRoot,
            workspaceName: dependencyOccurrence.name,
        });

        if (dependencyWorkspaceDir === undefined) {
            continue;
        }

        const dependencyRule = await loadConfig(dependencyWorkspaceDir);
        const allowedOnlyIn = dependencyRule?.['allowed-only-in'];

        if (allowedOnlyIn === undefined || allowedOnlyIn.packages.includes(workspaceName)) {
            continue;
        }

        errors.push(
            `${workspaceName}: ${JSON.stringify(dependencyOccurrence.name)} is allowed only in ${formatAllowedOnlyInPackages(allowedOnlyIn)} and must not be listed in ${dependencyOccurrence.field}. Reason: ${allowedOnlyIn.reason}`,
        );
    }

    return errors;
};

export const requireForbiddenDeps: Requirement<'workspace'> = {
    name: 'forbidden-deps',
    scope: 'workspace',
    verify: async context => {
        let packageJson: PackageJson;

        try {
            packageJson = readPackageJson<PackageJson>(context.workspaceDir);
        } catch {
            return [
                `${context.workspaceName}: ${PACKAGE_JSON_FILE} is missing or contains invalid JSON.`,
            ];
        }

        const localRule = await loadForbiddenDepsConfig(context.workspaceDir);
        const workspaceDirectories = getWorkspaceDirectoryResolver(context.repoRoot);

        const dependencyOccurrences = collectDependencyOccurrences(packageJson);
        const errors = new Set<string>([
            ...getInvalidConfiguredPackagesErrors({
                dependencyRule: localRule,
                workspaceDirectories,
                workspaceName: context.workspaceName,
            }),
            ...getForbiddenDependencyErrors({
                dependencyOccurrences,
                dependencyRule: localRule,
                workspaceName: context.workspaceName,
            }),
            ...(await getAllowedOnlyErrors({
                dependencyOccurrences,
                getWorkspaceDirByName: getWorkspaceDirectoryByName,
                loadConfig: loadForbiddenDepsConfig,
                repoRoot: context.repoRoot,
                workspaceName: context.workspaceName,
            })),
        ]);

        return [...errors];
    },
};

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { type PackageJson, readPackageJson } from '@trezor/node-utils';
import { typedObjectKeys } from '@trezor/utils';

import type {
    AllowedDepsRule,
    AllowedOnlyInRule,
    ForbiddenDepsConfig,
    ForbiddenInRule,
} from './forbiddenDepsTypes';
import { getWorkspaceDirectoryMap } from '../../workspaces';
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
        forbiddenDeps.flatMap(forbiddenDependency =>
            forbiddenDependency.packageName === undefined
                ? []
                : [[forbiddenDependency.packageName, forbiddenDependency] as const],
        ),
    );

const getForbiddenDependencyPrefixes = (
    forbiddenDeps: NonNullable<ForbiddenDepsConfig['forbidden-deps']>,
) =>
    forbiddenDeps.flatMap(forbiddenDependency =>
        forbiddenDependency.packageNamePrefix === undefined ? [] : [forbiddenDependency],
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

/**
 * A config also covers the workspaces beneath its directory, so a tree can state its boundary once
 * instead of repeating it in every package, and a package added later inherits it.
 */
const loadInheritedConfigs = async (repoRoot: string, workspaceDir: string) => {
    const configs: Array<ForbiddenDepsConfig | undefined> = [];

    for (
        let directory = dirname(workspaceDir);
        directory.startsWith(repoRoot) && directory !== dirname(directory);
        directory = dirname(directory)
    ) {
        configs.push(await loadForbiddenDepsConfig(directory));
    }

    return configs.flatMap(config => (config === undefined ? [] : [config]));
};

const getAllowedDepsRules = (
    configs: ReadonlyArray<ForbiddenDepsConfig>,
): ReadonlyArray<AllowedDepsRule> =>
    configs.flatMap(config => {
        const allowedDeps = config['allowed-deps'];

        return allowedDeps === undefined ? [] : [allowedDeps];
    });

const getWorkspaceDirectoryResolver = (repoRoot: string): WorkspaceDirectories =>
    getWorkspaceDirectoryMap(repoRoot);

const getWorkspaceDirectoryByName: WorkspaceDirectoryResolver = ({ repoRoot, workspaceName }) =>
    getWorkspaceDirectoryResolver(repoRoot).get(workspaceName);

const parseForbiddenInPattern = (rule: ForbiddenInRule) => {
    try {
        return { pattern: new RegExp(rule.packageNamePattern), error: null };
    } catch {
        return {
            pattern: null,
            error: `${JSON.stringify(rule.packageNamePattern)} in "forbidden-in" is not a valid packageNamePattern regular expression.`,
        };
    }
};

type InvalidConfiguredPackagesErrorsParams = {
    readonly allowedDepsRules: ReadonlyArray<AllowedDepsRule>;
    readonly dependencyRule: ForbiddenDepsConfig | undefined;
    readonly workspaceDirectories: WorkspaceDirectories;
    readonly workspaceName: string;
};

const getInvalidConfiguredPackagesErrors = ({
    allowedDepsRules,
    dependencyRule,
    workspaceDirectories,
    workspaceName,
}: InvalidConfiguredPackagesErrorsParams): ReadonlyArray<string> => {
    const errors: string[] = [];

    for (const allowedDepsRule of allowedDepsRules) {
        for (const packageName of allowedDepsRule.except ?? []) {
            if (workspaceDirectories.has(packageName)) {
                continue;
            }

            errors.push(
                `${workspaceName}: ${JSON.stringify(packageName)} in "allowed-deps" is not an existing workspace package.`,
            );
        }
    }

    const forbiddenIn = dependencyRule?.['forbidden-in'];
    if (forbiddenIn !== undefined) {
        const { error } = parseForbiddenInPattern(forbiddenIn);
        if (error !== null) {
            errors.push(`${workspaceName}: ${error}`);
        }
    }

    for (const forbiddenDependency of dependencyRule?.['forbidden-deps'] ?? []) {
        if (forbiddenDependency.packageName === undefined) {
            continue;
        }

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

type AllowedDependencyErrorsParams = {
    readonly allowedDepsRules: ReadonlyArray<AllowedDepsRule>;
    readonly dependencyOccurrences: ReadonlyArray<DependencyOccurrence>;
    readonly workspaceDirectories: WorkspaceDirectories;
    readonly workspaceName: string;
};

/** Packages outside the monorepo are not covered by a workspace allowlist. */
export const getAllowedDependencyErrors = ({
    allowedDepsRules,
    dependencyOccurrences,
    workspaceDirectories,
    workspaceName,
}: AllowedDependencyErrorsParams): ReadonlyArray<string> =>
    dependencyOccurrences.flatMap(dependencyOccurrence => {
        if (!workspaceDirectories.has(dependencyOccurrence.name)) {
            return [];
        }

        return allowedDepsRules.flatMap(allowedDepsRule => {
            const isAllowed =
                allowedDepsRule.packageNamePrefixes.some(packageNamePrefix =>
                    dependencyOccurrence.name.startsWith(packageNamePrefix),
                ) || (allowedDepsRule.except ?? []).includes(dependencyOccurrence.name);

            if (isAllowed) {
                return [];
            }

            return [
                `${workspaceName}: ${JSON.stringify(dependencyOccurrence.name)} is not an allowed dependency in ${dependencyOccurrence.field}. Reason: ${allowedDepsRule.reason}`,
            ];
        });
    });

type ForbiddenDependencyErrorsParams = {
    readonly dependencyOccurrences: ReadonlyArray<DependencyOccurrence>;
    readonly dependencyRule: ForbiddenDepsConfig | undefined;
    readonly workspaceName: string;
};

export const getForbiddenDependencyErrors = ({
    dependencyOccurrences,
    dependencyRule,
    workspaceName,
}: ForbiddenDependencyErrorsParams): ReadonlyArray<string> => {
    const forbiddenDepsMap = createForbiddenDepsMap(dependencyRule?.['forbidden-deps'] ?? []);
    const forbiddenDependencyPrefixes = getForbiddenDependencyPrefixes(
        dependencyRule?.['forbidden-deps'] ?? [],
    );

    return dependencyOccurrences.flatMap(dependencyOccurrence => {
        const forbiddenDependency =
            forbiddenDepsMap.get(dependencyOccurrence.name) ??
            forbiddenDependencyPrefixes.find(
                ({ packageNamePrefix, except }) =>
                    dependencyOccurrence.name.startsWith(packageNamePrefix) &&
                    !(except ?? []).includes(dependencyOccurrence.name),
            );

        if (forbiddenDependency === undefined) {
            return [];
        }

        return [
            `${workspaceName}: ${JSON.stringify(dependencyOccurrence.name)} is forbidden in ${dependencyOccurrence.field}. Reason: ${forbiddenDependency.reason}`,
        ];
    });
};

type DependencyConsumerErrorsParams = {
    readonly dependencyOccurrences: ReadonlyArray<DependencyOccurrence>;
    readonly getWorkspaceDirByName: WorkspaceDirectoryResolver;
    readonly loadConfig: ForbiddenDepsConfigLoader;
    readonly repoRoot: string;
    readonly workspaceName: string;
};

export const getDependencyConsumerErrors = async ({
    dependencyOccurrences,
    getWorkspaceDirByName,
    loadConfig,
    repoRoot,
    workspaceName,
}: DependencyConsumerErrorsParams): Promise<ReadonlyArray<string>> => {
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

        if (allowedOnlyIn !== undefined && !allowedOnlyIn.packages.includes(workspaceName)) {
            errors.push(
                `${workspaceName}: ${JSON.stringify(dependencyOccurrence.name)} is allowed only in ${formatAllowedOnlyInPackages(allowedOnlyIn)} and must not be listed in ${dependencyOccurrence.field}. Reason: ${allowedOnlyIn.reason}`,
            );
        }

        const forbiddenIn = dependencyRule?.['forbidden-in'];
        if (forbiddenIn === undefined) {
            continue;
        }

        const { pattern, error } = parseForbiddenInPattern(forbiddenIn);
        if (error !== null) {
            errors.push(`${dependencyOccurrence.name}: ${error}`);
        } else if (pattern.test(workspaceName)) {
            errors.push(
                `${workspaceName}: ${JSON.stringify(dependencyOccurrence.name)} is forbidden in ${dependencyOccurrence.field} by its "forbidden-in" rule. Reason: ${forbiddenIn.reason}`,
            );
        }
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
        const configs = [
            ...(localRule === undefined ? [] : [localRule]),
            ...(await loadInheritedConfigs(context.repoRoot, context.workspaceDir)),
        ];
        const dependencyRule: ForbiddenDepsConfig = {
            ...localRule,
            'forbidden-deps': configs.flatMap(config => config['forbidden-deps'] ?? []),
        };
        const allowedDepsRules = getAllowedDepsRules(configs);
        const workspaceDirectories = getWorkspaceDirectoryResolver(context.repoRoot);

        const dependencyOccurrences = collectDependencyOccurrences(packageJson);
        const errors = new Set<string>([
            ...getInvalidConfiguredPackagesErrors({
                allowedDepsRules,
                dependencyRule,
                workspaceDirectories,
                workspaceName: context.workspaceName,
            }),
            ...getAllowedDependencyErrors({
                allowedDepsRules,
                dependencyOccurrences,
                workspaceDirectories,
                workspaceName: context.workspaceName,
            }),
            ...getForbiddenDependencyErrors({
                dependencyOccurrences,
                dependencyRule,
                workspaceName: context.workspaceName,
            }),
            ...(await getDependencyConsumerErrors({
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

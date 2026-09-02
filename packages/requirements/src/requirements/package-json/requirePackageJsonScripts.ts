import { type PackageJson, readPackageJson } from '@trezor/node-utils';
import { typedObjectEntries } from '@trezor/utils';

import { walkDirectory } from '../../fileSystem';
import type { Requirement } from '../Requirement';

const PACKAGE_JSON_FILE = 'package.json';

type RequiredScriptConfig = {
    readonly command?: string | RegExp;
    readonly ignoredPackages?: ReadonlyArray<string>;
    readonly isRequired?: (workspaceDir: string) => boolean;
};

const IGNORED_TEST_FILE_DIRECTORIES = new Set([
    'e2e',
    'lib',
    'node_modules',
    'package-template',
    'package-template-native',
]);

const hasUnitTestFile = (directoryPath: string): boolean => {
    const walkDirectoryGenerator = walkDirectory(directoryPath, {
        shouldEnterDirectory: ({ entry: directory }) =>
            !IGNORED_TEST_FILE_DIRECTORIES.has(directory.name),
        fileFilter: ({ entry }) => entry.isFile() && entry.name.endsWith('.test.ts'),
    });
    // generator yielded no items, equivalent to Array.length === 0
    const isEmpty = walkDirectoryGenerator.next().done === true;

    return !isEmpty;
};

const REQUIRED_SCRIPTS: Record<string, RequiredScriptConfig> = {
    depcheck: {
        command: 'yarn g:depcheck',
        ignoredPackages: [
            'connect-example-electron-main',
            'connect-mobile-example',
            'connect-example-node',
            '@trezor/webextension-mv3-sw-ts',
        ],
    },
    'lint:js': {
        command: "yarn g:eslint '**/*.{ts,tsx,js}'",
        ignoredPackages: ['@trezor/eslint', '@suite-common/earn-stablecoin-api'],
    },
    'type-check': {
        command: /^yarn g:tsc --build.*$/,
        ignoredPackages: [
            '@trezor/suite-desktop',
            'connect-example-electron-main',
            'connect-mobile-example',
            'connect-example-node',
        ],
    },
    'test:unit': {
        ignoredPackages: ['@trezor/suite-e2e'],
        isRequired: hasUnitTestFile,
    },
};

const matchesScriptCommand = (
    actualCommand: string | undefined,
    expectedCommand: string | RegExp | undefined,
) => {
    if (typeof actualCommand !== 'string') return false;

    if (expectedCommand === undefined) return actualCommand.length > 0;

    if (typeof expectedCommand === 'string') return actualCommand === expectedCommand;

    return new RegExp(expectedCommand.source, expectedCommand.flags).test(actualCommand);
};

const formatExpectedCommand = (expectedCommand: string | RegExp) =>
    typeof expectedCommand === 'string' ? `"${expectedCommand}"` : `matching ${expectedCommand}`;

const formatScriptRequirement = (scriptName: string, scriptConfig: RequiredScriptConfig) => {
    if (scriptConfig.command === undefined) {
        return `scripts.${scriptName} must be defined`;
    }

    return `scripts.${scriptName} must be ${formatExpectedCommand(scriptConfig.command)}`;
};

export const requirePackageJsonScripts: Requirement<'workspace'> = {
    name: 'package-json-scripts',
    scope: 'workspace',
    verify: context => {
        let parsed: PackageJson;

        try {
            parsed = readPackageJson<PackageJson>(context.workspaceDir);
        } catch {
            return Promise.resolve([
                `${context.workspaceName}: ${PACKAGE_JSON_FILE} is missing or contains invalid JSON.`,
            ]);
        }

        const errors = typedObjectEntries(REQUIRED_SCRIPTS)
            .filter(([scriptName, scriptConfig]) => {
                if (scriptConfig.ignoredPackages?.includes(context.workspaceName)) {
                    return false;
                }

                if (scriptConfig.isRequired?.(context.workspaceDir) === false) {
                    return false;
                }

                return !matchesScriptCommand(parsed.scripts?.[scriptName], scriptConfig.command);
            })
            .map(
                ([scriptName, scriptConfig]) =>
                    `${context.workspaceName}: ${formatScriptRequirement(scriptName, scriptConfig)} in ${PACKAGE_JSON_FILE}.`,
            );

        return Promise.resolve(errors);
    },
};

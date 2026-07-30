import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
    for (const { entry } of walkDirectory(directoryPath, {
        shouldEnterDirectory: ({ entry: directory }) =>
            !IGNORED_TEST_FILE_DIRECTORIES.has(directory.name),
    })) {
        if (entry.isFile() && entry.name.endsWith('.test.ts')) {
            return true;
        }
    }

    return false;
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

type PackageJson = {
    readonly scripts?: Record<string, string | undefined>;
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
        const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);

        let parsed: PackageJson;

        try {
            parsed = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
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

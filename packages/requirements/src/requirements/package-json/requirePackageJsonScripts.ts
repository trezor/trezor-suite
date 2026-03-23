import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { typedObjectEntries } from '@trezor/utils';

import type { Requirement } from '../Requirement';

const PACKAGE_JSON_FILE = 'package.json';

type RequiredScriptConfig = {
    readonly command: string | RegExp;
    readonly ignoredPackages?: ReadonlyArray<string>;
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
        ignoredPackages: ['@trezor/eslint', '@suite-common/earn-api'],
    },
    'type-check': {
        command: /^yarn g:tsc --build.*$/,
        ignoredPackages: [
            '@trezor/address-validator',
            '@trezor/suite-desktop',
            'connect-example-electron-main',
            'connect-mobile-example',
            'connect-example-node',
        ],
    },
};

type PackageJson = {
    readonly scripts?: Record<string, string | undefined>;
};

const matchesScriptCommand = (
    actualCommand: string | undefined,
    expectedCommand: string | RegExp,
) => {
    if (typeof actualCommand !== 'string') return false;

    if (typeof expectedCommand === 'string') return actualCommand === expectedCommand;

    return new RegExp(expectedCommand.source, expectedCommand.flags).test(actualCommand);
};

const formatExpectedCommand = (expectedCommand: string | RegExp) =>
    typeof expectedCommand === 'string' ? `"${expectedCommand}"` : `matching ${expectedCommand}`;

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

                return !matchesScriptCommand(parsed.scripts?.[scriptName], scriptConfig.command);
            })
            .map(
                ([scriptName, scriptConfig]) =>
                    `${context.workspaceName}: scripts.${scriptName} must be ${formatExpectedCommand(scriptConfig.command)} in ${PACKAGE_JSON_FILE}.`,
            );

        return Promise.resolve(errors);
    },
};

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { typedObjectEntries } from '@trezor/utils';

import type { Requirement } from '../Requirement';

const PACKAGE_JSON_FILE = 'package.json';

type RequiredScriptConfig = {
    readonly command: string;
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
};

type PackageJson = {
    readonly scripts?: Record<string, string | undefined>;
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

                return parsed.scripts?.[scriptName] !== scriptConfig.command;
            })
            .map(
                ([scriptName, scriptConfig]) =>
                    `${context.workspaceName}: scripts.${scriptName} must be "${scriptConfig.command}" in ${PACKAGE_JSON_FILE}.`,
            );

        return Promise.resolve(errors);
    },
};

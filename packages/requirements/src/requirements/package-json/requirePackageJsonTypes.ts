import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement, WorkspaceContext } from '../Requirement';

const PACKAGE_JSON_FILE = 'package.json';
const DEFAULT_TYPES_FIELD = './libDev/src/index.d.ts';

const TYPES_FIELD_OVERRIDES: Record<string, string> = {
    '@trezor/suite': './libDev/index.d.ts',
};

const getRequiredTypesField = (workspaceName: string) =>
    TYPES_FIELD_OVERRIDES[workspaceName] ?? DEFAULT_TYPES_FIELD;

const isIgnoredWorkspace = (workspaceName: string) =>
    [
        'connect-example-electron-main',
        'connect-mobile-example',
        'connect-example-node',
        '@trezor/webextension-mv3-sw-ts',
    ].some(packageName => packageName === workspaceName);

type PackageJson = {
    readonly types?: string;
    readonly [key: string]: unknown;
};

const readPackageJson = (packageJsonPath: string): PackageJson | undefined => {
    try {
        return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
    } catch {
        return undefined;
    }
};

const getVerificationErrors = (context: WorkspaceContext) => {
    if (isIgnoredWorkspace(context.workspaceName)) {
        return [];
    }

    const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);
    const parsed = readPackageJson(packageJsonPath);
    const requiredTypesField = getRequiredTypesField(context.workspaceName);

    if (!parsed) {
        return [
            `${context.workspaceName}: ${PACKAGE_JSON_FILE} is missing or contains invalid JSON.`,
        ];
    }

    if (parsed.types !== requiredTypesField) {
        return [
            `${context.workspaceName}: types must be "${requiredTypesField}" in ${PACKAGE_JSON_FILE}.`,
        ];
    }

    return [];
};

export const requirePackageJsonTypes: Requirement<'workspace'> = {
    name: 'package-json-types',
    scope: 'workspace',
    verify: context => Promise.resolve(getVerificationErrors(context)),
    fix: context => {
        if (isIgnoredWorkspace(context.workspaceName)) {
            return Promise.resolve([]);
        }

        const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);
        const parsed = readPackageJson(packageJsonPath);
        const requiredTypesField = getRequiredTypesField(context.workspaceName);

        if (!parsed) {
            return Promise.resolve([
                `${context.workspaceName}: ${PACKAGE_JSON_FILE} is missing or contains invalid JSON.`,
            ]);
        }

        writeFileSync(
            packageJsonPath,
            `${JSON.stringify(
                {
                    ...parsed,
                    types: requiredTypesField,
                },
                null,
                4,
            )}\n`,
            'utf-8',
        );

        return Promise.resolve(getVerificationErrors(context));
    },
};

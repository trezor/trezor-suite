import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement, WorkspaceContext } from '../Requirement';

const PACKAGE_JSON_FILE = 'package.json';
const DEFAULT_TYPES_FIELD = './libDev/src/index.d.ts';

const TYPES_FIELD_OVERRIDES: Record<string, string> = {
    '@trezor/analytics-log-server': './libDev/index.d.ts',
    '@trezor/connect-web': './libDev/connect-web/src/index.d.ts',
    '@trezor/eslint': './libDev/src/index.d.mts',
    '@trezor/suite': './libDev/index.d.ts',
};

type PackageExport = {
    readonly types: string;
    readonly default: string;
};

const REQUIRED_TYPED_SUBPATH_EXPORTS: Record<string, Record<string, PackageExport>> = {
    '@suite-common/earn-stablecoin': {
        './src/allowance': {
            types: './libDev/src/allowance/index.d.ts',
            default: './src/allowance/index.ts',
        },
        './src/signing': {
            types: './libDev/src/signing/index.d.ts',
            default: './src/signing/index.ts',
        },
        './src/tx-simulation': {
            types: './libDev/src/tx-simulation/index.d.ts',
            default: './src/tx-simulation/index.ts',
        },
    },
    '@suite-common/schemas': {
        './src/evm': {
            types: './libDev/src/evm/index.d.ts',
            default: './src/evm/index.ts',
        },
    },
    '@suite/tx-simulation': {
        './src/common': {
            types: './libDev/src/common/index.d.ts',
            default: './src/common/index.ts',
        },
        './src/evm': {
            types: './libDev/src/evm/index.d.ts',
            default: './src/evm/index.ts',
        },
    },
};

const getRequiredTypesField = ({
    workspaceDir,
    workspaceName,
}: WorkspaceContext): string | undefined => {
    const typesFieldOverride = TYPES_FIELD_OVERRIDES[workspaceName];

    if (typesFieldOverride) {
        return typesFieldOverride;
    }

    if (
        existsSync(join(workspaceDir, 'src/index.ts')) ||
        existsSync(join(workspaceDir, 'src/index.tsx'))
    ) {
        return DEFAULT_TYPES_FIELD;
    }

    return undefined;
};

const isTypesFieldExemptWorkspace = (workspaceName: string) =>
    [
        'connect-example-electron-main',
        'connect-mobile-example',
        'connect-example-node',
        '@suite-native/app',
        '@trezor/analytics-docs',
        '@trezor/connect-explorer',
        '@trezor/scripts',
        '@trezor/suite-build',
        '@trezor/suite-data',
        '@trezor/suite-desktop',
        '@trezor/suite-desktop-core',
        '@trezor/suite-e2e',
        '@trezor/transport-test',
        '@trezor/webextension-mv3-sw-ts',
    ].some(packageName => packageName === workspaceName);

type PackageJson = {
    readonly types?: string;
    readonly exports?: Record<string, unknown>;
    readonly [key: string]: unknown;
};

const readPackageJson = (packageJsonPath: string): PackageJson | undefined => {
    try {
        return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
    } catch {
        return undefined;
    }
};

const getPackageJsonWithoutTypes = (packageJson: PackageJson): PackageJson => {
    const packageJsonWithoutTypes = { ...packageJson };

    delete packageJsonWithoutTypes.types;

    return packageJsonWithoutTypes;
};

const getTypedSubpathVerificationErrors = (
    context: WorkspaceContext,
    packageJson: PackageJson,
    requiredExports: Record<string, PackageExport>,
) => {
    const errors: string[] = [];

    if (packageJson.types !== undefined) {
        errors.push(
            `${context.workspaceName}: types must be omitted when typed subpaths define the public API in ${PACKAGE_JSON_FILE}.`,
        );
    }

    Object.entries(requiredExports).forEach(([subpath, requiredExport]) => {
        const actualExport = packageJson.exports?.[subpath];

        if (
            typeof actualExport !== 'object' ||
            actualExport === null ||
            !('types' in actualExport) ||
            actualExport.types !== requiredExport.types ||
            !('default' in actualExport) ||
            actualExport.default !== requiredExport.default
        ) {
            errors.push(
                `${context.workspaceName}: exports["${subpath}"] must define types "${requiredExport.types}" and default "${requiredExport.default}" in ${PACKAGE_JSON_FILE}.`,
            );
        }
    });

    return errors;
};

const getVerificationErrors = (context: WorkspaceContext) => {
    const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);
    const parsed = readPackageJson(packageJsonPath);

    if (isTypesFieldExemptWorkspace(context.workspaceName)) {
        if (parsed?.types !== undefined) {
            return [
                `${context.workspaceName}: types must be omitted because the workspace does not expose a typed package root in ${PACKAGE_JSON_FILE}.`,
            ];
        }

        return [];
    }

    if (!parsed) {
        return [
            `${context.workspaceName}: ${PACKAGE_JSON_FILE} is missing or contains invalid JSON.`,
        ];
    }

    const requiredTypedSubpathExports = REQUIRED_TYPED_SUBPATH_EXPORTS[context.workspaceName];

    if (requiredTypedSubpathExports) {
        return getTypedSubpathVerificationErrors(context, parsed, requiredTypedSubpathExports);
    }

    const requiredTypesField = getRequiredTypesField(context);

    if (!requiredTypesField) {
        return [
            `${context.workspaceName}: workspace without src/index.ts(x) must configure a declaration entry or exemption.`,
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
        const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);
        const parsed = readPackageJson(packageJsonPath);

        if (isTypesFieldExemptWorkspace(context.workspaceName)) {
            if (parsed?.types !== undefined) {
                writeFileSync(
                    packageJsonPath,
                    `${JSON.stringify(getPackageJsonWithoutTypes(parsed), null, 4)}\n`,
                    'utf-8',
                );
            }

            return Promise.resolve([]);
        }

        if (!parsed) {
            return Promise.resolve([
                `${context.workspaceName}: ${PACKAGE_JSON_FILE} is missing or contains invalid JSON.`,
            ]);
        }

        const requiredTypedSubpathExports = REQUIRED_TYPED_SUBPATH_EXPORTS[context.workspaceName];

        if (requiredTypedSubpathExports) {
            const packageJsonWithoutTypes = getPackageJsonWithoutTypes(parsed);

            writeFileSync(
                packageJsonPath,
                `${JSON.stringify(
                    {
                        ...packageJsonWithoutTypes,
                        exports: {
                            ...packageJsonWithoutTypes.exports,
                            ...requiredTypedSubpathExports,
                        },
                    },
                    null,
                    4,
                )}\n`,
                'utf-8',
            );

            return Promise.resolve(getVerificationErrors(context));
        }

        const requiredTypesField = getRequiredTypesField(context);

        if (!requiredTypesField) {
            return Promise.resolve(getVerificationErrors(context));
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

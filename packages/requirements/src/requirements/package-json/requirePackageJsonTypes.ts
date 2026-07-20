import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement, WorkspaceContext } from '../Requirement';

const PACKAGE_JSON_FILE = 'package.json';
const DEFAULT_TYPES_FIELD = './libDev/src/index.d.ts';
const DECLARATION_FILE_PATTERN = /\.d\.(?:ts|mts|cts)$/;

const TYPES_FIELD_OVERRIDES: Record<string, string> = {
    '@trezor/analytics-log-server': './libDev/index.d.ts',
    '@trezor/connect-web': './libDev/connect-web/src/index.d.ts',
    '@trezor/eslint': './libDev/src/index.d.mts',
    '@trezor/suite': './libDev/index.d.ts',
    '@trezor/suite-desktop-api': './libDev/src/types.d.ts',
};

type PackageExport = {
    readonly types: string;
    readonly default: string;
};

const NETWORK_TYPED_EXPORTS: Record<string, PackageExport> = {
    './constants': {
        types: './libDev/src/constants/index.d.ts',
        default: './src/constants/index.ts',
    },
    './runtime': {
        types: './libDev/src/runtime/index.d.ts',
        default: './src/runtime/index.ts',
    },
    './types': {
        types: './libDev/src/types/index.d.ts',
        default: './src/types/index.ts',
    },
    '.': {
        types: DEFAULT_TYPES_FIELD,
        default: './src/index.ts',
    },
};

const BLOCKCHAIN_LINK_TYPED_EXPORTS: Record<string, PackageExport> = {
    '.': {
        types: DEFAULT_TYPES_FIELD,
        default: './src/index.ts',
    },
    './workers/baseWorker': {
        types: './libDev/workers/baseWorker/index.d.ts',
        default: './workers/baseWorker/index.ts',
    },
    './workers/blockbook': {
        types: './libDev/workers/blockbook/index.d.ts',
        default: './workers/blockbook/index.ts',
    },
    './workers/blockfrost': {
        types: './libDev/workers/blockfrost/index.d.ts',
        default: './workers/blockfrost/index.ts',
    },
    './workers/electrum': {
        types: './libDev/workers/electrum/index.d.ts',
        default: './workers/electrum/index.ts',
    },
    './workers/evm-rpc': {
        types: './libDev/workers/evm-rpc/index.d.ts',
        default: './workers/evm-rpc/index.ts',
    },
    './workers/ripple': {
        types: './libDev/workers/ripple/index.d.ts',
        default: './workers/ripple/index.ts',
    },
    './workers/solana': {
        types: './libDev/workers/solana/index.d.ts',
        default: './workers/solana/index.ts',
    },
    './workers/stellar': {
        types: './libDev/workers/stellar/index.d.ts',
        default: './workers/stellar/index.ts',
    },
    './src/workers/blockbook': {
        types: './libDev/src/workers/blockbook/index.d.ts',
        default: './src/workers/blockbook/index.ts',
    },
    './src/workers/blockbook/websocket': {
        types: './libDev/src/workers/blockbook/websocket.d.ts',
        default: './src/workers/blockbook/websocket.ts',
    },
    './src/workers/blockfrost': {
        types: './libDev/src/workers/blockfrost/index.d.ts',
        default: './src/workers/blockfrost/index.ts',
    },
    './src/workers/ripple': {
        types: './libDev/src/workers/ripple/index.d.ts',
        default: './src/workers/ripple/index.ts',
    },
    './src/utils/socks-proxy-agent.ts': {
        types: './libDev/src/utils/socks-proxy-agent.d.ts',
        default: './src/utils/socks-proxy-agent.ts',
    },
};

const REQUIRED_TYPED_EXPORTS: Record<string, Record<string, PackageExport>> = {
    '@trezor/network-cardano': NETWORK_TYPED_EXPORTS,
    '@trezor/network-ripple': NETWORK_TYPED_EXPORTS,
    '@trezor/network-solana': NETWORK_TYPED_EXPORTS,
    '@trezor/network-stellar': NETWORK_TYPED_EXPORTS,
    '@trezor/analytics-log-server': {
        '.': {
            types: './libDev/index.d.ts',
            default: './dist/index.js',
        },
    },
    '@trezor/blockchain-link': BLOCKCHAIN_LINK_TYPED_EXPORTS,
    '@trezor/connect-common': {
        '.': {
            types: DEFAULT_TYPES_FIELD,
            default: './src/index.ts',
        },
        './pathUtils': {
            types: './libDev/src/utils/pathUtils.d.ts',
            default: './src/utils/pathUtils.ts',
        },
        './src/callableMethods': {
            types: './libDev/src/callableMethods.d.ts',
            default: './src/callableMethods.ts',
        },
        './src/constants': {
            types: './libDev/src/constants/index.d.ts',
            default: './src/constants/index.ts',
        },
        './src/constants/*': {
            types: './libDev/src/constants/*.d.ts',
            default: './src/constants/*.ts',
        },
        './src/data': {
            types: './libDev/src/data/index.d.ts',
            default: './src/data/index.ts',
        },
        './src/data/*': {
            types: './libDev/src/data/*.d.ts',
            default: './src/data/*.ts',
        },
        './src/events': {
            types: './libDev/src/events/index.d.ts',
            default: './src/events/index.ts',
        },
        './src/events/*': {
            types: './libDev/src/events/*.d.ts',
            default: './src/events/*.ts',
        },
        './src/factory': {
            types: './libDev/src/factory.d.ts',
            default: './src/factory.ts',
        },
        './src/impl/*': {
            types: './libDev/src/impl/*.d.ts',
            default: './src/impl/*.ts',
        },
        './src/messageChannel/*': {
            types: './libDev/src/messageChannel/*.d.ts',
            default: './src/messageChannel/*.ts',
        },
        './src/types': {
            types: './libDev/src/types/index.d.ts',
            default: './src/types/index.ts',
        },
        './src/types/api': {
            types: './libDev/src/types/api/index.d.ts',
            default: './src/types/api/index.ts',
        },
        './src/types/*': {
            types: './libDev/src/types/*.d.ts',
            default: './src/types/*.ts',
        },
        './src/utils/*': {
            types: './libDev/src/utils/*.d.ts',
            default: './src/utils/*.ts',
        },
    },
    '@trezor/suite': {
        '.': {
            types: './libDev/index.d.ts',
            default: './index.ts',
        },
        './mocks': {
            types: './libDev/mocks/index.d.ts',
            default: './mocks/index.ts',
        },
    },
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
    '@suite-common/react-query': {
        '.': {
            types: DEFAULT_TYPES_FIELD,
            default: './src/index.ts',
        },
        './react': {
            types: './libDev/react/index.d.ts',
            default: './react/index.ts',
        },
        './react-native': {
            types: './libDev/react-native/index.d.ts',
            default: './react-native/index.ts',
        },
    },
    '@suite-common/schemas': {
        './src/evm': {
            types: './libDev/src/evm/index.d.ts',
            default: './src/evm/index.ts',
        },
    },
    '@suite-common/test-utils': {
        '.': {
            types: DEFAULT_TYPES_FIELD,
            default: './src/index.ts',
        },
        './globalOverrides': {
            types: './libDev/globalOverrides/index.d.ts',
            default: './globalOverrides/index.ts',
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

const TYPES_FIELD_EXEMPT_WORKSPACES = [
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
];

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
    TYPES_FIELD_EXEMPT_WORKSPACES.some(packageName => packageName === workspaceName);

const getPackageJsonWithoutTypes = (packageJson: PackageJson): PackageJson => {
    const packageJsonWithoutTypes = { ...packageJson };

    delete packageJsonWithoutTypes.types;

    return packageJsonWithoutTypes;
};

const getTypedExportVerificationErrors = (
    context: WorkspaceContext,
    packageJson: PackageJson,
    requiredExports: Record<string, PackageExport>,
) => {
    const errors: string[] = [];

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

const getExportTypesConditionVerificationErrors = (
    context: WorkspaceContext,
    exports: Record<string, unknown> | undefined,
) => {
    const errors: string[] = [];

    const verifyTypesConditions = (value: unknown, exportPath: string) => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return;
        }

        Object.entries(value).forEach(([condition, conditionValue]) => {
            const conditionPath = `${exportPath}.${condition}`;

            if (
                condition === 'types' &&
                typeof conditionValue === 'string' &&
                !DECLARATION_FILE_PATTERN.test(conditionValue)
            ) {
                errors.push(
                    `${context.workspaceName}: ${conditionPath} must target a declaration file with an explicit extension in ${PACKAGE_JSON_FILE}.`,
                );
            }

            verifyTypesConditions(conditionValue, conditionPath);
        });
    };

    Object.entries(exports ?? {}).forEach(([subpath, value]) => {
        verifyTypesConditions(value, `exports["${subpath}"]`);
    });

    return errors;
};

const getVerificationErrors = (context: WorkspaceContext) => {
    const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);
    const parsed = readPackageJson(packageJsonPath);

    if (!parsed) {
        return [
            `${context.workspaceName}: ${PACKAGE_JSON_FILE} is missing or contains invalid JSON.`,
        ];
    }

    if (isTypesFieldExemptWorkspace(context.workspaceName)) {
        if (parsed.types !== undefined) {
            return [
                `${context.workspaceName}: types must be omitted because the workspace does not expose a typed package root in ${PACKAGE_JSON_FILE}.`,
            ];
        }

        return [];
    }

    const requiredTypesField = getRequiredTypesField(context);
    const requiredTypedExports = REQUIRED_TYPED_EXPORTS[context.workspaceName];

    if (!requiredTypesField && !requiredTypedExports) {
        return [
            `${context.workspaceName}: workspace without src/index.ts(x) must configure a declaration entry or exemption.`,
        ];
    }

    const errors: string[] = [];

    if (requiredTypesField) {
        if (parsed.types !== requiredTypesField) {
            errors.push(
                `${context.workspaceName}: types must be "${requiredTypesField}" in ${PACKAGE_JSON_FILE}.`,
            );
        }
    } else if (parsed.types !== undefined) {
        errors.push(
            `${context.workspaceName}: types must be omitted when typed subpaths define the public API in ${PACKAGE_JSON_FILE}.`,
        );
    }

    if (requiredTypedExports) {
        errors.push(...getTypedExportVerificationErrors(context, parsed, requiredTypedExports));
    } else if (parsed.exports?.['.'] !== undefined) {
        errors.push(
            `${context.workspaceName}: exports["."] shadows the types field and must configure a typed root export contract.`,
        );
    }

    errors.push(...getExportTypesConditionVerificationErrors(context, parsed.exports));

    return errors;
};

export const requirePackageJsonTypes: Requirement<'workspace'> = {
    name: 'package-json-types',
    scope: 'workspace',
    verify: context => Promise.resolve(getVerificationErrors(context)),
    fix: context => {
        const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);
        const parsed = readPackageJson(packageJsonPath);

        if (!parsed) {
            return Promise.resolve(getVerificationErrors(context));
        }

        if (isTypesFieldExemptWorkspace(context.workspaceName)) {
            if (parsed.types !== undefined) {
                writeFileSync(
                    packageJsonPath,
                    `${JSON.stringify(getPackageJsonWithoutTypes(parsed), null, 4)}\n`,
                    'utf-8',
                );
            }

            return Promise.resolve(getVerificationErrors(context));
        }

        const requiredTypesField = getRequiredTypesField(context);
        const requiredTypedExports = REQUIRED_TYPED_EXPORTS[context.workspaceName];

        if (!requiredTypesField && !requiredTypedExports) {
            return Promise.resolve(getVerificationErrors(context));
        }

        const packageJsonWithRequiredTypes = requiredTypesField
            ? { ...parsed, types: requiredTypesField }
            : getPackageJsonWithoutTypes(parsed);
        const fixedPackageJson = requiredTypedExports
            ? {
                  ...packageJsonWithRequiredTypes,
                  exports: {
                      ...packageJsonWithRequiredTypes.exports,
                      ...requiredTypedExports,
                  },
              }
            : packageJsonWithRequiredTypes;

        writeFileSync(
            packageJsonPath,
            `${JSON.stringify(fixedPackageJson, null, 4)}\n`,
            'utf-8',
        );

        return Promise.resolve(getVerificationErrors(context));
    },
};

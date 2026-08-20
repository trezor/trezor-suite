import { RuleTester } from 'eslint';
import { parser } from 'typescript-eslint';

import { rules } from './rules';

const ruleTester = new RuleTester();

const allowedEntryPointPatterns = [
    /^@suite-common\/bluetooth\/mocks$/,
    /^@suite-common\/thp\/mocks$/,
    /^@suite-common\/test-utils\/globalOverrides$/,
];

ruleTester.run('no-package-deep-imports', rules['no-package-deep-imports'], {
    valid: [
        // Top-level package imports are allowed
        { code: "import { foo } from '@suite-common/wallet-utils';" },
        { code: "import { foo } from '@suite-native/intl';" },
        { code: "import { foo } from '@trezor/utils';" },
        { code: "import { foo } from '@suite/components';" },
        // Mocks entry point is allowed
        {
            code: "import { mock } from '@suite-common/bluetooth/mocks';",
            options: [{ allowedEntryPointPatterns }],
        },
        {
            code: "import { mock } from '@suite-common/thp/mocks';",
            options: [{ allowedEntryPointPatterns }],
        },
        // Non-restricted scopes are allowed regardless of depth
        { code: "import { debounce } from 'lodash/fp';" },
        { code: "import React from 'react';" },
        { code: "import { foo } from '@reduxjs/toolkit/query';" },
        // Re-exports from allowed paths
        { code: "export { foo } from '@suite-common/wallet-utils';" },
        { code: "export * from '@trezor/utils';" },
        // Custom packageScopes option
        {
            code: "import { foo } from '@suite-common/wallet-utils/src/deep';",
            options: [{ packageScopes: ['@custom'] }],
        },
        // Deep imports can be allowed for selected package entry points
        {
            code: "import { connectCallableMethods } from '@trezor/connect/src/factory';",
            options: [{ ignoredPackages: ['@trezor/connect'] }],
        },
        // Explicitly configured package entry points are allowed.
        {
            code: "import '@suite-common/test-utils/globalOverrides';",
            options: [{ allowedEntryPointPatterns }],
        },
    ],
    invalid: [
        // Deep imports from @suite-common
        {
            code: "import { foo } from '@suite-common/wallet-utils/src/amountUtils';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/wallet-utils/src/amountUtils',
                        packageImportPath: '@suite-common/wallet-utils',
                    },
                },
            ],
        },
        // Deep imports from @trezor
        {
            code: "import { BigNumber } from '@trezor/utils/src/bigNumber';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@trezor/utils/src/bigNumber',
                        packageImportPath: '@trezor/utils',
                    },
                },
            ],
        },
        // Deep imports from @suite-native
        {
            code: "import { foo } from '@suite-native/intl/src/getTranslation';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-native/intl/src/getTranslation',
                        packageImportPath: '@suite-native/intl',
                    },
                },
            ],
        },
        // Deep mocks imports should suggest the mocks entry point
        {
            code: "import { mock } from '@suite-common/bluetooth/mocks/createBluetoothDeviceCommon';",
            options: [{ allowedEntryPointPatterns }],
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/bluetooth/mocks/createBluetoothDeviceCommon',
                        packageImportPath: '@suite-common/bluetooth/mocks',
                    },
                },
            ],
        },
        // Similarly prefixed paths are not entry points.
        {
            code: "import { mock } from '@suite-common/bluetooth/mocksInternal';",
            options: [{ allowedEntryPointPatterns }],
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/bluetooth/mocksInternal',
                        packageImportPath: '@suite-common/bluetooth',
                    },
                },
            ],
        },
        // Imports below a configured entry point should suggest the public entry point.
        {
            code: "import '@suite-common/test-utils/globalOverrides/internal';",
            options: [{ allowedEntryPointPatterns }],
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/test-utils/globalOverrides/internal',
                        packageImportPath: '@suite-common/test-utils/globalOverrides',
                    },
                },
            ],
        },
        // export * re-exports from deep paths
        {
            code: "export * from '@suite-common/wallet-core/src/send/sendFormThunks';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@suite-common/wallet-core/src/send/sendFormThunks',
                        packageImportPath: '@suite-common/wallet-core',
                    },
                },
            ],
        },
        // Named re-exports from deep paths
        {
            code: "export { foo } from '@trezor/connect/src/api/bitcoin';",
            errors: [
                {
                    messageId: 'doNotImportPackageDeepPath',
                    data: {
                        sourcePath: '@trezor/connect/src/api/bitcoin',
                        packageImportPath: '@trezor/connect',
                    },
                },
            ],
        },
    ],
});

ruleTester.run('no-suite-imports-in-suite-common', rules['no-suite-imports-in-suite-common'], {
    valid: [
        {
            code: "import { foo } from '@suite-common/wallet-utils';",
            filename: '/repo/suite-common/example/src/file.ts',
        },
        {
            code: "import { foo } from '@trezor/utils';",
            filename: '/repo/suite-common/example/src/file.ts',
        },
        {
            code: "import { foo } from '@suite/intl';",
            filename: '/repo/suite/app/src/file.ts',
        },
        {
            code: "export { foo } from '@suite-common/wallet-utils';",
            filename: '/repo/suite-common/example/src/file.ts',
        },
    ],
    invalid: [
        {
            code: "import { TranslationKey } from '@suite/intl';",
            filename: '/repo/suite-common/wallet-types/src/transaction.ts',
            errors: [
                {
                    messageId: 'doNotImportSuiteIntoSuiteCommon',
                    data: { sourcePath: '@suite/intl' },
                },
            ],
        },
        {
            code: "import { getTranslation } from '@suite-native/intl';",
            filename: '/repo/suite-common/intl-types/src/file.ts',
            errors: [
                {
                    messageId: 'doNotImportSuiteIntoSuiteCommon',
                    data: { sourcePath: '@suite-native/intl' },
                },
            ],
        },
    ],
});

ruleTester.run('no-cross-network-imports', rules['no-cross-network-imports'], {
    valid: [
        // Importing the shared network module is always allowed
        {
            code: "import { foo } from '@trezor/network-module-suite-common-types';",
            filename: '/repo/networks/bitcoin/network-bitcoin-suite-common/src/file.ts',
        },
        // Importing from the package's own network is allowed
        {
            code: "import { foo } from '@trezor/network-cardano-suite-common';",
            filename: '/repo/networks/cardano/network-cardano/src/file.ts',
        },
        // Generic (non-network) @trezor packages are allowed
        {
            code: "import { foo } from '@trezor/utils';",
            filename: '/repo/networks/bitcoin/network-bitcoin-suite-common/src/file.ts',
        },
        // Third-party imports are allowed
        {
            code: "import { foo } from '@solana/kit';",
            filename: '/repo/networks/solana/network-solana/src/file.ts',
        },
        // Files outside the networks tree are not restricted
        {
            code: "import { foo } from '@trezor/network-cardano-suite-common';",
            filename: '/repo/suite-common/wallet-core/src/file.ts',
        },
        // The shared module importing generic packages is allowed
        {
            code: "import { foo } from '@trezor/utils';",
            filename: '/repo/networks/network-module/network-module-suite-common-types/src/file.ts',
        },
        // Relative imports that stay inside the package are allowed
        {
            code: "import { foo } from './helper';",
            filename: '/repo/networks/bitcoin/network-bitcoin-suite-common/src/file.ts',
        },
        {
            code: "import { foo } from '../constants';",
            filename: '/repo/networks/bitcoin/network-bitcoin-suite-common/src/sub/file.ts',
        },
    ],
    invalid: [
        // A network importing another network is forbidden
        {
            code: "import { foo } from '@trezor/network-cardano-suite-common';",
            filename: '/repo/networks/bitcoin/network-bitcoin-suite-common/src/file.ts',
            errors: [
                {
                    messageId: 'doNotImportOtherNetwork',
                    data: {
                        sourcePath: '@trezor/network-cardano-suite-common',
                        ownNetwork: 'bitcoin',
                    },
                },
            ],
        },
        // Dynamic import() of another network is forbidden
        {
            code: "const load = () => import('@trezor/network-cardano-suite-common');",
            filename: '/repo/networks/bitcoin/network-bitcoin-suite-common/src/file.ts',
            languageOptions: { ecmaVersion: 2020, sourceType: 'module' },
            errors: [
                {
                    messageId: 'doNotImportOtherNetwork',
                    data: {
                        sourcePath: '@trezor/network-cardano-suite-common',
                        ownNetwork: 'bitcoin',
                    },
                },
            ],
        },
        // require() of another network is forbidden
        {
            code: "const solana = require('@trezor/network-solana');",
            filename: '/repo/networks/bitcoin/network-bitcoin-suite-common/src/file.ts',
            errors: [
                {
                    messageId: 'doNotImportOtherNetwork',
                    data: {
                        sourcePath: '@trezor/network-solana',
                        ownNetwork: 'bitcoin',
                    },
                },
            ],
        },
        // A relative import escaping the package is forbidden (a disguised cross-package/network path)
        {
            code: "import { foo } from '../../cardano/network-cardano-suite-common/src/foo';",
            filename: '/repo/networks/bitcoin/network-bitcoin-suite-common/src/file.ts',
            errors: [
                {
                    messageId: 'doNotEscapePackage',
                    data: {
                        sourcePath: '../../cardano/network-cardano-suite-common/src/foo',
                    },
                },
            ],
        },
        // Re-exports across networks are forbidden too
        {
            code: "export * from '@trezor/network-solana';",
            filename: '/repo/networks/ethereum/network-ethereum-suite-common/src/file.ts',
            errors: [
                {
                    messageId: 'doNotImportOtherNetwork',
                    data: {
                        sourcePath: '@trezor/network-solana',
                        ownNetwork: 'ethereum',
                    },
                },
            ],
        },
        // The shared network module must not import a specific network
        {
            code: "import { foo } from '@trezor/network-tron-suite-common';",
            filename: '/repo/networks/network-module/network-module-suite-common-types/src/file.ts',
            errors: [
                {
                    messageId: 'doNotImportOtherNetwork',
                    data: {
                        sourcePath: '@trezor/network-tron-suite-common',
                        ownNetwork: 'module',
                    },
                },
            ],
        },
    ],
});

const typescriptRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    },
});

typescriptRuleTester.run('analytics-event-name', rules['analytics-event-name'], {
    valid: [
        { code: "export enum EventType { Foo = 'settings/app-log-exported' }" },
        { code: "export enum EventType { Bar = 'dashboard/send-modal' }" },
        { code: "export enum EventType { Baz = 'wallet-connect/init' }" },
        { code: "export enum EventType { A = 'device/connect', B = 'receive/flow-entered' }" },
        { code: "export enum OtherEnum { X = 'anything' }" },
        { code: "const x = 'settings/foo';" },
    ],
    invalid: [
        {
            code: "export enum EventType { Bad = 'coin_discovery' }",
            errors: [{ messageId: 'invalidFormat' }],
        },
        {
            code: "export enum EventType { Bad = 'unknown-domain/event' }",
            errors: [{ messageId: 'invalidDomain', data: { domain: 'unknown-domain' } }],
        },
        {
            code: "export enum EventType { Bad = 'settings/appLogExported' }",
            errors: [{ messageId: 'notKebabCase', data: { eventPart: 'settings/appLogExported' } }],
        },
        {
            code: "export enum EventType { Bad = 'settings/device/change_pin' }",
            errors: [
                {
                    messageId: 'notKebabCase',
                    data: { eventPart: 'settings/device/change_pin' },
                },
            ],
        },
    ],
} as Parameters<typeof typescriptRuleTester.run>[2]);

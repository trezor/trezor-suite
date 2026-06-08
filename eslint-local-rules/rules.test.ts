import { RuleTester } from 'eslint';

import { rules } from './rules';

const ruleTester = new RuleTester();

ruleTester.run('no-package-deep-imports', rules['no-package-deep-imports'], {
    valid: [
        // Top-level package imports are allowed
        { code: "import { foo } from '@suite-common/wallet-utils';" },
        { code: "import { foo } from '@suite-native/intl';" },
        { code: "import { foo } from '@trezor/utils';" },
        { code: "import { foo } from '@suite/components';" },
        // Mocks entry point is allowed
        { code: "import { mock } from '@suite-common/bluetooth/mocks';" },
        { code: "import { mock } from '@suite-common/thp/mocks';" },
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

ruleTester.run('analytics-event-name', rules['analytics-event-name'], {
    parser: require.resolve('typescript-eslint/parser'),
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
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
} as Parameters<typeof ruleTester.run>[2]);

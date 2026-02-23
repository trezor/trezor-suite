import { RuleTester } from 'eslint';

import rules from './rules';

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

import { RuleTester } from 'eslint';

import { noSuiteImportsInSuiteCommonRule } from './noSuiteImportsInSuiteCommonRule';

const ruleTester = new RuleTester();

ruleTester.run('no-suite-imports-in-suite-common', noSuiteImportsInSuiteCommonRule, {
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

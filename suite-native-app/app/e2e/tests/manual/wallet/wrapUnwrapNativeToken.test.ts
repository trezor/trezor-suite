import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Standalone wrap native token',
        {
            testCase: 'A user can wrap a native token (ETH -> WETH) via the standalone flow',
            prerequisites: [
                'connected device with firmware 2.12.4 or newer',
                'seed with ETH funds on it',
                'dev mode enabled in the app',
            ],
            steps: [
                'Navigate to an ETH account and open the settings',
                'Verify the wrap entry point is present and open the wrap flow',
                'Verify the account balance is displayed in the screen header',
                'Fill in an amount and verify the crypto/fiat input switching works',
                'Verify an amount exceeding the balance is rejected with a validation error',
                'Review the transaction data and sign it on the device',
                'Verify the complete screen shows the sent amount without a minus sign',
                'Verify the transaction in the account history carries the wrap label',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.Medium,
            stream: TestStream.Earn,
        },
        async () => {},
    );

    it(
        'Standalone unwrap native token',
        {
            testCase: 'A user can unwrap a wrapped token (WETH -> ETH) via the standalone flow',
            prerequisites: [
                'connected device with firmware 2.12.4 or newer',
                'seed with WETH funds on it',
            ],
            steps: [
                'Navigate to the account holding WETH and open the settings',
                'Verify the unwrap entry point is present and open the unwrap flow',
                'Verify the token pair is shown in the screen title and the account balance in the header',
                'Fill in an amount and verify the crypto/fiat input switching works',
                'Verify a prefilled amount is revalidated when the balance changes in the meantime',
                'Review the transaction data and sign it on the device',
                'Verify the complete screen shows the sent amount without a minus sign',
                'Verify the transaction in the account history carries the unwrap label',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});

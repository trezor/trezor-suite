import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Add new account',
        {
            testCase: 'Add new account',
            prerequisites: [
                'Connected device with transaction history',
                'Already on-boarded Trezor Suite application',
            ],
            steps: [
                'Device connected and discovery finished.',
                'Navigate to My assets section and press +',
                'Select Bitcoin',
                'Select Change address type',
                'Select Legacy SegWit or Taproot account type',
                'Press Continue button',
                'Account is added',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.High,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

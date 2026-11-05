import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Dust phishing protection and threshold',
        {
            testCase:
                'Dust phishing protection hides dust transactions and the threshold can be changed',
            prerequisites: [
                'connected device',
                'seed with an account containing dust transactions (very small incoming amounts)',
            ],
            steps: [
                'Navigate to Settings > Security and open the Dust phishing protection screen',
                'Enable the dust phishing protection',
                'Navigate to the account with dust transactions',
                'Verify transactions below the threshold are marked as suspected phishing',
                'Go back to the dust phishing settings and change the threshold value',
                'Verify the set of transactions marked as dust changes according to the new threshold',
                'Disable the protection and verify dust transactions are displayed normally again',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

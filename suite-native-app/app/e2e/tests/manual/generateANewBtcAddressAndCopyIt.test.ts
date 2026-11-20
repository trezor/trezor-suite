import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Generate a new BTC address and copy it',
        {
            testCase: 'Generate a new BTC address and copy it',
            prerequisites: ['an app with an account already imported'],
            steps: [
                'On bottom bar click Receive and select a random imported account',
                'Verify address verification warning screen shows up and click Show address',
                'Verify QR code and address appear; click Copy and verify Address copied notification',
                'Navigate out of account receive address and paste clipboard into a messaging app to verify address matches',
            ],
            category: TestCategory.Wallets,
            priority: TestPriority.Critical,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

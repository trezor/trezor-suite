import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Custom backend',
        {
            testCase:
                'A custom blockchain backend can be set for a coin and the app connects to it',
            prerequisites: [
                'connected device',
                'seed with funds on it',
                'URL of a working custom backend (e.g. a Blockbook instance)',
            ],
            steps: [
                'Navigate to Settings > Coins and open the backends screen of an enabled coin (e.g. Bitcoin)',
                'Select custom backend type and enter the custom backend URL',
                'Confirm the change and wait for reconnection',
                'Verify the accounts of the coin still load and sync via the custom backend',
                'Enter an invalid URL and verify a validation error is shown',
                'Revert to the default backend and verify the app reconnects',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

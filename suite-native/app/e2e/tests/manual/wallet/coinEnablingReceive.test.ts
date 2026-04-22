import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Coin enabling - receive',
        {
            testCase: 'Coin enabling - receive',
            prerequisites: ['connected device', 'one remembered device that is disconnected'],
            steps: [
                'Connect a device (different than the remembered)',
                'Wait for the initial discovery',
                'Navigate to Receive and click + to add new',
                'Click on a new coin that wasn’t enabled before',
                'Verify dashboard starts discovery for that coin',
                'Navigate to the view-only device and verify its coins are unchanged',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Critical,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

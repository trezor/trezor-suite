import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Coin enabling - settings',
        {
            testCase: 'Coin enabling - settings',
            prerequisites: ['connected device', 'one remembered device that is disconnected'],
            steps: [
                'Connect a device (different than the remembered) and wait for initial discovery',
                'Navigate to Settings → Enabled coins and enable a new coin that wasn’t enabled before',
                'Verify dashboard starts discovery for that coin and view-only device unchanged',
                'Switch back to connected device, go to Settings → Enabled coins and disable a coin present in connected device, Portfolio and view-only device',
                'Verify the disabled coin is disabled only for devices and remains in Portfolio tracker',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Critical,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

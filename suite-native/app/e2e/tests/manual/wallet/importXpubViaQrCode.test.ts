import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Import XPUB via QR code',
        {
            testCase: 'Import XPUB via QR code',
            prerequisites: ['A Suite version without camera privileges', 'A QR code of an XPUB'],
            steps: [
                'Start the app and verify Connect and Track page is rendered',
                'Click Sync & Track and select Bitcoin',
                'System dialog for camera usage should appear; click Allow and verify camera opens',
                'Scan the QR code and verify user is transferred to Coin synced screen',
                'Press Confirm',
            ],
            category: TestCategory.Application,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

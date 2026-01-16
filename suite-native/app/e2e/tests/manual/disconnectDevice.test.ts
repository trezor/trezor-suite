import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Disconnect device',
        {
            testCase: 'Disconnect device',
            prerequisites: [
                'Connected device with transaction history',
                'Already on-boarded Lite application',
            ],
            steps: [
                'Connect device and verify detection and discovery start',
                'Disconnect device after or during discovery',
                'Verify application recognizes the disconnection',
                'Verify navigation to welcome/landing page or tracker if accounts are imported',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Medium,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});

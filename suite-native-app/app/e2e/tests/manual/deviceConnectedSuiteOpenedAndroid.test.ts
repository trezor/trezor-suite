import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device connected and Suite opened from Android mode',
        {
            testCase: 'Device connected and Suite opened from Android modal',
            prerequisites: [
                'Device model T or S3 with transaction history connected',
                'Already on-boarded Lite application',
                'View-only wallet is enabled (Trezor was connected to this device once in the past)',
            ],
            steps: [
                'Connect device and unlock via PIN if enabled',
                'Launch the app from Android modal (not app launcher)',
                'Verify application recognizes device and informs user it is connecting',
                'Verify discovery starts and loading account info is displayed',
                'Verify device name is displayed at upper section and discovery finishes with accounts list rendered',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Critical,
            stream: TestStream.Connect,
        },
        async () => {},
    );
});

import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device connected and detected',
        {
            testCase: 'Device connected and detected',
            prerequisites: [
                'Device with transaction history connected',
                'Already on-boarded Lite application',
            ],
            steps: [
                'Connect device and unlock via PIN if enabled',
                'Verify application recognizes device and informs user it is connecting',
                'Verify discovery starts and loading account info is displayed',
                'Verify device name is displayed at upper section of app',
                'Verify discovery finishes and accounts list is rendered',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Critical,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});

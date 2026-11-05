import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device settings',
        {
            testCase: 'Device settings',
            prerequisites: [
                'Connected device with transaction history',
                'Already on-boarded Lite application',
            ],
            steps: [
                'Connect device and wait for detection and discovery start',
                'In tracker/device switcher ensure Device info button is active and click it',
                'Verify information about update, model, and label is rendered',
                'Verify bottom link to trezor.io/store is present and clickable',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

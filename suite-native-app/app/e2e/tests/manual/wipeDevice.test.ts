import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Wipe device',
        {
            testCase: 'Wipe device',
            prerequisites: ['already setup device'],
            steps: [
                'Connect device and go to Device settings',
                'Choose Wipe device and verify two warnings are shown',
                'Confirm both warnings and verify wipe starts on device and Continue on your Trezor appears on mobile',
                'Complete wipe and verify Start setup screen appears',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Medium,
            stream: TestStream.Firmware,
        },
        async () => {},
    );
});

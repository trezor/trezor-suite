import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Check backup',
        {
            testCase: 'Check backup',
            prerequisites: ['already setup device'],
            steps: [
                'Navigate to Device settings',
                'Click on Check wallet backup option',
                'Verify backup check flow starts and appears on device',
                'After successful device check, verify Your backup is valid screen appears',
                'Verify app returns to device settings',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Medium,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});

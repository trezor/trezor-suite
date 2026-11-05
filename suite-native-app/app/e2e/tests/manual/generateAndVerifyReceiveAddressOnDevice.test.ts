import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Generate and verify receive address on device',
        {
            testCase: 'Generate and verify receive address on device',
            prerequisites: [
                'Connected device with transaction history',
                'Already on-boarded Lite application',
            ],
            steps: [
                'Ensure device connected and discovery finished',
                'Navigate to a random Bitcoin account and generate receive address',
                'Compare and confirm the address on device',
                'Repeat for all devices as needed',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

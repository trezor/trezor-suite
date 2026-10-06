import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device - Onboarding - recovery',
        {
            testCase: 'Device - Onboarding - recovery',
            prerequisites: ['device without fw'],
            steps: [
                'Connect device to phone and verify Let’s get started screen appears',
                'Continue through security check (3 steps)',
                'Verify firmware installation warning appears and install firmware',
                'Verify Firmware installed message and device authentication (Your Trezor is genuine)',
                'On wallet creation/recovery screen choose Recover and follow Get your wallet backup flow',
                'Complete wallet recovery on device and best-practices screens',
                'Set up PIN, enable at least one coin and verify discovery starts',
            ],
            category: TestCategory.Onboarding,
            priority: TestPriority.Medium,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

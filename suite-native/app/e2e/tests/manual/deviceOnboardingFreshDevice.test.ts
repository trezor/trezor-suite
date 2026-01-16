import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device - Onboarding - fresh device',
        {
            testCase: 'Device - Onboarding - fresh device',
            prerequisites: ['device without fw'],
            steps: [
                'Connect device to phone and verify Let’s get started screen appears',
                'Continue through security check (3 steps)',
                'Verify firmware installation warning appears and install firmware',
                'Verify Firmware installed message and device authentication (Your Trezor is genuine)',
                'Go through tutorial and choose Create new wallet',
                'Verify 4 wallet backup info screens and wallet backup type selection',
                'Complete wallet creation on device and best-practices screens',
                'Set up PIN, enable at least one coin and verify discovery starts',
            ],
            category: TestCategory.Onboarding,
            priority: TestPriority.Medium,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});

import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Coin enabling - onboarding',
        {
            testCase: 'Coin enabling - onboarding',
            prerequisites: ['fresh app', 'connected device'],
            steps: [
                'Coin enabling should appear after initial screens and after connecting a device',
                'Select any number of coins available for the connected device (only device-supported coins should appear)',
                'Ensure at least one coin is selected to continue to dashboard',
                'After confirming selection, verify dashboard appears and discovery starts',
                'Verify discovery finishes only for enabled coins and empty account shown if no history',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Critical,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device connected, unlocked and detected',
        {
            testCase: 'Device connected, unlocked and detected',
            prerequisites: [
                'Device model One with PIN enabled and with transaction history',
                'Already on-boarded Lite application',
            ],
            steps: [
                'Connect device and verify system recognizes it',
                'Verify device displays PIN matrix and application renders PIN matrix',
                'After entering incorrect PIN verify prompt to reenter PIN or open help',
                'Enter correct PIN and verify device unlocks and discovery starts',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Critical,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});

import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Switch between tracker and connected device',
        {
            testCase: 'Switch between tracker and connected device',
            prerequisites: [
                'Connected device with transaction history',
                'Already on-boarded Lite application',
                'Imported at least one account in tracker',
            ],
            steps: [
                'Connect device and verify detection and discovery start',
                'Switch between device and portfolio tracker and verify UI updates accordingly',
            ],
            category: TestCategory.Dashboard,
            priority: TestPriority.Medium,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

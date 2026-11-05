import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Rename account',
        {
            testCase: 'Rename account',
            prerequisites: ['An app with an account already imported'],
            steps: [
                'Navigate to a random bitcoin account in My Assets with transaction history',
                'Press settings (⚙️) in top-right and select edit (✏️)',
                'Rename account and verify name changed after navigating back',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.Low,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

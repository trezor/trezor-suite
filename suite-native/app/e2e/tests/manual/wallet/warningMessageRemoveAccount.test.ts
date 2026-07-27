import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Warning message remove account',
        {
            testCase: 'Warning message remove account',
            prerequisites: ['An app with an account imported in the Portfolio tracker'],
            steps: [
                'Navigate to a random account in Portfolio tracker in My Assets with transaction history',
                'Press settings (⚙️) and select Remove coin',
                'Verify warning is rendered; select Cancel to return to previous section',
                'Select Remove coin and verify navigation to Home or Import/Sync dialogue if it was the only imported account',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.Low,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

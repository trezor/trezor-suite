import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Check an account',
        {
            testCase: 'Check an account',
            prerequisites: ['an app with an account BTC already imported'],
            steps: [
                'Navigate to My assets and click on any Bitcoin account to open Account detail page',
                'Verify graph and Transactions history cards are displayed',
                'Click on any transaction to open tx detail page',
                'Verify tx detail info is displayed and check buttons: Parameters, Compare values, Inputs & Outputs',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

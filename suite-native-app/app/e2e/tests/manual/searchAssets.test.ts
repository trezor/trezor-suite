import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Search assets',
        {
            testCase: 'Search assets',
            prerequisites: ['An app with an account BTC already imported'],
            steps: [
                'Navigate to My assets and click the search (🔍) icon',
                'Verify Search assets title and search field are rendered and cancel search via Cancel button',
                'Open search again, enter text included in at least one account name and verify accounts are filtered',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

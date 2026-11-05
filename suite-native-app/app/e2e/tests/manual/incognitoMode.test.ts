import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Incognito mode',
        {
            testCase: 'Incognito mode',
            prerequisites: ['An app version with already imported btc XPUB'],
            steps: [
                'On bottom bar click Settings gear icon and select Privacy & Security',
                'Enable Discreet mode via toggle',
                'Navigate through accounts and transactions and verify numeric values are blurred',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

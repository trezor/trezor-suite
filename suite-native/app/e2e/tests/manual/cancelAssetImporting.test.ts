import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Cancel asset importing by X icons',
        {
            testCase: 'Cancel asset importing by < and X icons',
            prerequisites: ['none'],
            steps: [
                'Empty app: start the app and verify Sync & Track button appears',
                'Select Bitcoin',
                'Type the XPUB in the enter XPUB input field and click Confirm',
                'Click < button and verify user is transferred back to Home page',
                'App with at least one account: start the app, go to My assets, click + and select Bitcoin',
                'Type XPUB, click Confirm, click x button and verify user is transferred back to Home page',
            ],
            category: TestCategory.Application,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Import an already imported XPUB',
        {
            testCase: 'Import an already imported XPUB',
            prerequisites: [
                'An app version with already imported btc XPUB',
                'The same btc XPUB key',
            ],
            steps: [
                'Start app, navigate to the already imported btc account, display xpub and copy it',
                'Navigate back to account section and select import',
                'Type the XPUB in enter XPUB manually and confirm; verify user is transferred to Coin already synced page',
                'Press Continue to app',
            ],
            category: TestCategory.Application,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

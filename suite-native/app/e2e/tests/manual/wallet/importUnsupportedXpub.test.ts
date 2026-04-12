import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Import an unsupported XPUB',
        {
            testCase: 'Import an unsupported XPUB',
            prerequisites: ['An XPUB key of an unsupported coin (e.g., DASH)'],
            steps: [
                'Navigate to My Assets and press + to import account',
                'Select Bitcoin and choose Scan public key',
                'Scan DASH XPUB and verify Account info failed message is displayed',
                'Press Go back and verify navigation back to XPUB Import page',
            ],
            category: TestCategory.Application,
            priority: TestPriority.High,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

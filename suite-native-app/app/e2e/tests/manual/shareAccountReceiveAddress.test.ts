import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        "Share account's receive address",
        {
            testCase: "Share account's receive address",
            prerequisites: ['An app with an account already imported'],
            steps: [
                'On bottom bar click Receive and select first account',
                'Click Show address and verify Receive address screen with QR and address appears',
                'Click Share and verify device system share dialog appears',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.Medium,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});

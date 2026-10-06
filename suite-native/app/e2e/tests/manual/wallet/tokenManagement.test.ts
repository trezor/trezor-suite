import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Token management - hide and unhide a token',
        {
            testCase: 'Tokens are listed for an account and can be hidden and unhidden',
            prerequisites: ['connected device', 'seed with an EVM account holding tokens'],
            steps: [
                'Navigate to the EVM account and open its tokens list',
                'Verify held tokens are listed with balance and fiat value',
                'Open the token settings of a token and hide it',
                'Verify the token is no longer displayed in the tokens list',
                'Unhide the token via the token settings',
                'Verify the token is displayed in the tokens list again',
                'Verify unverified/unknown tokens are communicated appropriately',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

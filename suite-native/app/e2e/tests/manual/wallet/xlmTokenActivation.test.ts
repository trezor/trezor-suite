import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Send form XLM',
        {
            testCase: 'XLM token activation',
            prerequisites: ['connected device', 'seed with funds on it'],
            steps: [
                'Navigate to XLM assets and select any account',
                'Click on Activate token and select any token from the list',
                'Sign the transaction for token activation',
                'Go back to the list of tokens of the specific XLM account and check if the token is activated',
                'Open that token and click on Deactivate token',
                'Sign the transaction for token deactivation',
                'Check if the token disappeared from the list of tokens',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

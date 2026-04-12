import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'ERC20 Transaction detail',
        {
            testCase: 'ERC20 Transaction detail',
            prerequisites: ['Imported Ethereum account with token transaction history'],
            steps: [
                'Navigate to an Ethereum account in My Assets that includes token transfers',
                'Select on Ethereum or any token',
                'Click on a received or sent transaction and open detailed sections',
                'Verify detailed sections contain valid blockbook data: Parameters, Compare values, Inputs and Outputs, Token name and value',
                'Open external blockbook link and verify the same transaction opens in web browser',
            ],
            category: TestCategory.Wallets,
            priority: TestPriority.Low,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

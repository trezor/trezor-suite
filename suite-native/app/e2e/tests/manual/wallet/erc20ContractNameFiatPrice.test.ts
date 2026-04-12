import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'ERC20 contract name and fiat price',
        {
            testCase: 'ERC20 contract name and fiat price',
            prerequisites: ['Ethereum account with token transaction history'],
            steps: [
                'Navigate to an Ethereum account in My Assets that includes token transfers',
                'Select one of the tokens',
                'Click on an ERC20 transaction with fiat value and open external blockbook link',
                'Verify same transaction opens in web browser and contract name and fiat value match Coingecko',
            ],
            category: TestCategory.Wallets,
            priority: TestPriority.Low,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

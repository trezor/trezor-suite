import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Asset detail screen',
        {
            testCase: 'The asset detail screen shows balances, price card and graph correctly',
            prerequisites: [
                'connected device',
                'seed with funds on multiple accounts of one network',
            ],
            steps: [
                'Navigate to an asset from the home screen and verify the asset detail opens',
                'Open the gear icon and verify its content is displayed correctly',
                'On earnable assets (e.g. ETH, USDT, USDC), verify the Earn badge is displayed',
                'Verify both the fiat and the asset balance are displayed and match the sum of the accounts',
                'Verify the price card displays the current price and the price change',
                'On an asset with no transactions, verify the price card is displayed below the empty transactions state',
                'Switch the graph timeframe to "All", leave the screen and return, and verify the timeframe is preserved',
                'Open an account from the asset detail and verify the navigation to the account detail works',
                'Open an account that has a balance but no recent transactions and check whether the Send button is visible.',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});

import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { countNonZeroBalanceAccounts } from '../accountBalanceAnalytics';

describe(countNonZeroBalanceAccounts.name, () => {
    it('excludes watch-only accounts', () => {
        const accounts = [
            mockWalletAccount({ balance: '1', symbol: 'btc' }),
            mockWalletAccount({ balance: '2', isWatchOnly: true, symbol: 'btc' }),
        ];

        expect(countNonZeroBalanceAccounts(accounts)).toBe(1);
    });
});

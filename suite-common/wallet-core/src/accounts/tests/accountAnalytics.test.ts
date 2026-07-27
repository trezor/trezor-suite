import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { countNonZeroBalanceAccounts } from '../accountBalanceAnalytics';
import { isAccountActiveForAnalytics } from '../accountsInfoAnalytics';

const watchOnlyAccount = mockWalletAccount({ balance: '2', isWatchOnly: true, symbol: 'btc' });

describe('watch-only account analytics', () => {
    it('excludes watch-only accounts from account metrics', () => {
        expect(isAccountActiveForAnalytics(watchOnlyAccount)).toBe(false);
        expect(
            countNonZeroBalanceAccounts([
                mockWalletAccount({ balance: '1', symbol: 'btc' }),
                watchOnlyAccount,
            ]),
        ).toBe(1);
    });
});

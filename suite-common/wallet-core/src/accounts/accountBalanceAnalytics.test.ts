import { WATCH_ONLY_ACCOUNT_TYPE, asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { countNonZeroBalanceAccounts } from './accountBalanceAnalytics';

describe(countNonZeroBalanceAccounts.name, () => {
    it('counts owned accounts holding a balance, never watch-only ones', () => {
        const btc = asNetworkSymbol('btc');

        expect(
            countNonZeroBalanceAccounts([
                mockWalletAccount({ symbol: btc, balance: '1' }),
                mockWalletAccount({
                    symbol: btc,
                    balance: '0',
                    descriptor: asAccountDescriptor('empty'),
                }),
                mockWalletAccount({
                    symbol: asNetworkSymbol('eth'),
                    balance: '1',
                    accountType: WATCH_ONLY_ACCOUNT_TYPE,
                    descriptor: asAccountDescriptor('watchOnly'),
                }),
            ]),
        ).toBe(1);
    });
});

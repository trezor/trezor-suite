import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { isAccountActiveForAnalytics } from '../accountsInfoAnalytics';

describe(isAccountActiveForAnalytics.name, () => {
    it('returns false for an active watch-only account', () => {
        expect(
            isAccountActiveForAnalytics(
                mockWalletAccount({
                    empty: false,
                    isWatchOnly: true,
                    symbol: 'btc',
                }),
            ),
        ).toBe(false);
    });
});

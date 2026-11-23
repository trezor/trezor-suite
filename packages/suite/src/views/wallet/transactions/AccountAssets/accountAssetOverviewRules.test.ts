import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { hasAccountAssetOverview, isAccountOneAddress } from './accountAssetOverviewRules';

const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

describe(hasAccountAssetOverview.name, () => {
    it('gives an account the asset overview', () => {
        expect(hasAccountAssetOverview(btcAccount)).toBe(true);
    });

    it('keeps a Privacy account on the overview it had', () => {
        const privacyAccount = { ...btcAccount, backendType: 'coinjoin' } as Account;

        expect(hasAccountAssetOverview(privacyAccount)).toBe(false);
    });
});

describe(isAccountOneAddress.name, () => {
    it('takes an address-based account as one address', () => {
        expect(isAccountOneAddress(ethAccount)).toBe(true);
    });

    it('does not take a UTXO account as one, whose descriptor is not an address', () => {
        expect(isAccountOneAddress(btcAccount)).toBe(false);
    });
});

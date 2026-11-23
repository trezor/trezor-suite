import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { isAccountAddressInHeader } from './isAccountAddressInHeader';

const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const adaAccount = mockWalletAccount({ symbol: asNetworkSymbol('ada') });

const onOverview = (account: Account) =>
    isAccountAddressInHeader({ account, routeName: 'wallet-index', isAssetFirstHome: true });

describe('the address in the header of the asset-first account overview', () => {
    it('is shown for an account that is one address', () => {
        expect(onOverview(ethAccount)).toBe(true);
    });

    it('is left out for a UTXO account, which has many addresses and an xpub for a descriptor', () => {
        expect(onOverview(btcAccount)).toBe(false);
        expect(onOverview(adaAccount)).toBe(false);
    });
});

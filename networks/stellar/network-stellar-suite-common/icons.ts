import type { NetworkIcon } from '@trezor/network-module-suite-common-types';
import type { StellarNetworkSymbol } from '@trezor/network-stellar/constants';
import { stellarAssets } from '@trezor/network-stellar-assets';

import { getStellarTokenLogoAddresses } from './src/getStellarTokenLogoAddresses';

export const stellarIcon: NetworkIcon<StellarNetworkSymbol> = {
    getIcons: stellarAssets.getIcons,
    getTokenLogoIdentifiers: (symbol, contract) =>
        symbol === 'xlm' ? getStellarTokenLogoAddresses(contract) : [contract],
};

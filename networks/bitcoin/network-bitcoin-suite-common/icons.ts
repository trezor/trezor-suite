import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin/constants';
import { bitcoinAssets } from '@trezor/network-bitcoin-assets';
import type { NetworkIcon } from '@trezor/network-module-suite-common-types';

export const bitcoinIcon: NetworkIcon<BitcoinNetworkSymbol> = {
    getIcons: bitcoinAssets.getIcons,
    getTokenLogoIdentifiers: (_symbol, contract) => [contract],
};

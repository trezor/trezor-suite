import type { NetworkIcon } from '@trezor/network-module-suite-common-types';
import type { TronNetworkSymbol } from '@trezor/network-tron/constants';
import { tronAssets } from '@trezor/network-tron-assets';

export const tronIcon: NetworkIcon<TronNetworkSymbol> = {
    getIcons: tronAssets.getIcons,
    getTokenLogoIdentifiers: (_symbol, contract) => [contract],
};

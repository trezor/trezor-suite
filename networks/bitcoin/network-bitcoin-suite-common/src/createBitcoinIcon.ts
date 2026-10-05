import type { NetworkAssetsModule, NetworkIcon } from '@trezor/network-assets-types';
import type { BitcoinAssetSymbol } from '@trezor/network-bitcoin-assets';
import { type BitcoinNetworkSymbol, supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import { createNetworkIcon } from '@trezor/network-module-suite-common-types';

export type BitcoinIconDeps = {
    bitcoinAssets: NetworkAssetsModule<BitcoinAssetSymbol>;
};

export const createBitcoinIcon = (deps: BitcoinIconDeps): NetworkIcon =>
    createNetworkIcon<BitcoinNetworkSymbol>({
        supportedNetworks: supportedBitcoinNetworks,
        assets: deps.bitcoinAssets,
    });

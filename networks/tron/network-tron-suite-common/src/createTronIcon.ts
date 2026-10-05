import type { NetworkAssetsModule, NetworkIcon } from '@trezor/network-assets-types';
import { createNetworkIcon } from '@trezor/network-module-suite-common-types';
import { type TronNetworkSymbol, supportedTronNetworks } from '@trezor/network-tron-types';

export type TronIconDeps = {
    tronAssets: NetworkAssetsModule<TronNetworkSymbol>;
};

export const createTronIcon = (deps: TronIconDeps): NetworkIcon =>
    createNetworkIcon<TronNetworkSymbol>({
        supportedNetworks: supportedTronNetworks,
        assets: deps.tronAssets,
    });

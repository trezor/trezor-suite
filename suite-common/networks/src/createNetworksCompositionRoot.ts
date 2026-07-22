import { createBitcoinNetworkModule } from '@trezor/network-bitcoin-suite';
import { createCardanoNetworkModule } from '@trezor/network-cardano-suite';
import { createEthereumNetworkModule } from '@trezor/network-ethereum-suite';
import { createRippleNetworkModule } from '@trezor/network-ripple-suite';
import { createSolanaNetworkModule } from '@trezor/network-solana-suite';
import { createStellarNetworkModule } from '@trezor/network-stellar-suite';
import { createTronNetworkModule } from '@trezor/network-tron-suite';

import { type NetworkModules } from './NetworkModules';

export const createNetworksCompositionRoot = (): NetworkModules => {
    // When adding a new Network Module, you have to
    //    1. register it here to have the runtime object for DI
    //    2. and in the `NetworkModules` to have static typings right
    const networkModules: NetworkModules = {
        bitcoin: createBitcoinNetworkModule(),
        ethereum: createEthereumNetworkModule(),
        ripple: createRippleNetworkModule(),
        cardano: createCardanoNetworkModule(),
        solana: createSolanaNetworkModule(),
        stellar: createStellarNetworkModule(),
        tron: createTronNetworkModule(),
    };

    return networkModules;
};

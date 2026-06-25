import { createBitcoinNetworkModule } from '@network-module/bitcoin-suite';
import { createCardanoNetworkModule } from '@network-module/cardano-suite';
import { createEthereumNetworkModule } from '@network-module/ethereum-suite';
import { createRippleNetworkModule } from '@network-module/ripple-suite';
import { createSolanaNetworkModule } from '@network-module/solana-suite';
import { createStellarNetworkModule } from '@network-module/stellar-suite';
import { createTronNetworkModule } from '@network-module/tron-suite';

import { type NetworksService, type StaticNetworkModules } from './NetworksService';

export const createNetworksCompositionRoot = (): NetworksService => {
    // When adding a new Network Module, you have to
    //    1. register it here to have the runtime object for DI
    //    2. and in the `StaticNetworkModules` to have static typings right
    const networkModules: StaticNetworkModules = {
        bitcoin: createBitcoinNetworkModule(),
        ethereum: createEthereumNetworkModule(),
        ripple: createRippleNetworkModule(),
        cardano: createCardanoNetworkModule(),
        solana: createSolanaNetworkModule(),
        stellar: createStellarNetworkModule(),
        tron: createTronNetworkModule(),
    };

    return { networkModules };
};

import { createBitcoinNetworkModule } from '@network-module/bitcoin-suite';
import { createCardanoNetworkModule } from '@network-module/cardano-suite';
import { createEthereumNetworkModule } from '@network-module/ethereum-suite';
import { createRippleNetworkModule } from '@network-module/ripple-suite';
import { createSolanaNetworkModule } from '@network-module/solana-suite';
import { createStellarNetworkModule } from '@network-module/stellar-suite';
import { type NetworkModule } from '@network-module/suite-types';
import { createTronNetworkModule } from '@network-module/tron-suite';

import { type NetworkType } from '@suite-common/wallet-config';

import { type NetworksService } from './NetworksService';

export const createNetworksCompositionRoot = (): NetworksService => {
    const networkModules = new Map<NetworkType, NetworkModule>([
        ['bitcoin', createBitcoinNetworkModule()],
        ['ethereum', createEthereumNetworkModule()],
        ['ripple', createRippleNetworkModule()],
        ['cardano', createCardanoNetworkModule()],
        ['solana', createSolanaNetworkModule()],
        ['stellar', createStellarNetworkModule()],
        ['tron', createTronNetworkModule()],
    ]);

    return { networkModules };
};

import { createBitcoinNetworkModule } from '@network-module/bitcoin-suite';
import { createCardanoNetworkModule } from '@network-module/cardano-suite';
import { createEthereumNetworkModule } from '@network-module/ethereum-suite';
import { createRippleNetworkModule } from '@network-module/ripple-suite';
import { createSolanaNetworkModule } from '@network-module/solana-suite';
import { createStellarNetworkModule } from '@network-module/stellar-suite';
import type { SuiteModuleApiDep } from '@network-module/suite-types';
import { createTronNetworkModule } from '@network-module/tron-suite';

import { type NetworkModules } from './NetworkModules';

export type CreateNetworksCompositionRootDeps = SuiteModuleApiDep;

export const createNetworksCompositionRoot = ({
    suiteModuleApi,
}: CreateNetworksCompositionRootDeps): NetworkModules => {
    // When adding a new Network Module, you have to
    //    1. register it here to have the runtime object for DI
    //    2. and in the `NetworkModules` to have static typings right
    const networkModules: NetworkModules = {
        bitcoin: createBitcoinNetworkModule({ suiteModuleApi }),
        ethereum: createEthereumNetworkModule({ suiteModuleApi }),
        ripple: createRippleNetworkModule({ suiteModuleApi }),
        cardano: createCardanoNetworkModule({ suiteModuleApi }),
        solana: createSolanaNetworkModule({ suiteModuleApi }),
        stellar: createStellarNetworkModule({ suiteModuleApi }),
        tron: createTronNetworkModule({ suiteModuleApi }),
    };

    return networkModules;
};

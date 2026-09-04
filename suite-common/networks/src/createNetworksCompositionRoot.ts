import { createBitcoinSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common';
import { createCardanoSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common';
import { createEthereumSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common/network-module';
import { createRippleSuiteCommonNetworkModule } from '@trezor/network-ripple-suite-common';
import { createSolanaSuiteCommonNetworkModule } from '@trezor/network-solana-suite-common';
import { createStellarSuiteCommonNetworkModule } from '@trezor/network-stellar-suite-common';
import { createTronSuiteCommonNetworkModule } from '@trezor/network-tron-suite-common';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { type NetworkModules } from './NetworkModules';
import type { NetworksServices } from './NetworksServices';
import { createAddressValidator } from './createAddressValidator';
import { createFindNetworkSymbolForProtocol } from './createFindNetworkSymbolForProtocol';
import { createGetNamedAddressSupport } from './createGetNamedAddressSupport';
import { createGetNetworkConfig } from './createGetNetworkConfig';
import { createGetSupportedNetworks } from './createGetSupportedNetworks';
import { createIsTestnet } from './createIsTestnet';

export const createNetworksCompositionRoot = (): NetworksServices => {
    // When adding a new Network Module, you have to
    //    1. register it here to have the runtime object for DI
    //    2. and in the `NetworkModules` to have static typings right
    const networkModules: NetworkModules = {
        bitcoin: createBitcoinSuiteCommonNetworkModule(),
        ethereum: createEthereumSuiteCommonNetworkModule(),
        ripple: createRippleSuiteCommonNetworkModule(),
        cardano: createCardanoSuiteCommonNetworkModule(),
        solana: createSolanaSuiteCommonNetworkModule(),
        stellar: createStellarSuiteCommonNetworkModule(),
        tron: createTronSuiteCommonNetworkModule(),
    };

    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
    const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });

    return {
        addressValidator: createAddressValidator({ networkModuleRepository }),
        findNetworkSymbolForProtocol: createFindNetworkSymbolForProtocol({
            getNetworkConfig,
            networkModuleRepository,
        }),
        getNamedAddressSupport: createGetNamedAddressSupport({ networkModuleRepository }),
        getNetworkConfig,
        getSupportedNetworks: createGetSupportedNetworks({ networkModuleRepository }),
        isTestnet: createIsTestnet({ networkModuleRepository }),
    };
};

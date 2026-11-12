import { createBitcoinSuiteNetworkModule } from '@trezor/network-bitcoin-suite';
import { createCardanoSuiteNetworkModule } from '@trezor/network-cardano-suite';
import { createEthereumSuiteNetworkModule } from '@trezor/network-ethereum-suite';

import { createSuiteNetworkModuleRepository } from './SuiteNetworkModuleRepository';
import { type GetSignVerifyDep, createGetSignVerify } from './createGetSignVerify';

export type SuiteNetworksServices = GetSignVerifyDep;

/** Registers the desktop and web network modules and the features Suite resolves from them. */
export const createSuiteNetworksCompositionRoot = (): SuiteNetworksServices => {
    const suiteNetworkModuleRepository = createSuiteNetworkModuleRepository({
        suiteNetworkModules: [
            createBitcoinSuiteNetworkModule(),
            createEthereumSuiteNetworkModule(),
            createCardanoSuiteNetworkModule(),
        ],
    });

    return {
        getSignVerify: createGetSignVerify({ suiteNetworkModuleRepository }),
    };
};

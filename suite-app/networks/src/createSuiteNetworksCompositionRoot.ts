import { createBitcoinSuiteNetworkModule } from '@trezor/network-bitcoin-suite';

import { createSuiteNetworkModuleRepository } from './SuiteNetworkModuleRepository';
import { type GetSignVerifyDep, createGetSignVerify } from './createGetSignVerify';

export type SuiteNetworksServices = GetSignVerifyDep;

/** Registers the desktop and web network modules and the features Suite resolves from them. */
export const createSuiteNetworksCompositionRoot = (): SuiteNetworksServices => {
    const suiteNetworkModuleRepository = createSuiteNetworkModuleRepository({
        suiteNetworkModules: [
            createBitcoinSuiteNetworkModule(),
        ],
    });

    return {
        getSignVerify: createGetSignVerify({ suiteNetworkModuleRepository }),
    };
};

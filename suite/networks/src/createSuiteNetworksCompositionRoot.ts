import type { NetworkModules } from '@suite-common/networks';
import type TrezorConnect from '@trezor/connect';
import { createBitcoinSuiteNetworkModule } from '@trezor/network-bitcoin-suite';
import { createCardanoSuiteNetworkModule } from '@trezor/network-cardano-suite';
import { createEthereumSuiteNetworkModule } from '@trezor/network-ethereum-suite';

import type { SuiteNetworkModules } from './SuiteNetworkModules';

export type CreateSuiteNetworksCompositionRootDeps = {
    suiteCommonNetworkModules: NetworkModules;
    trezorConnect: typeof TrezorConnect;
};

export const createSuiteNetworksCompositionRoot = ({
    suiteCommonNetworkModules,
    trezorConnect,
}: CreateSuiteNetworksCompositionRootDeps): SuiteNetworkModules => ({
    bitcoin: createBitcoinSuiteNetworkModule({
        suiteCommonNetworkModule: suiteCommonNetworkModules.bitcoin,
        trezorConnect,
    }),
    ethereum: createEthereumSuiteNetworkModule({
        suiteCommonNetworkModule: suiteCommonNetworkModules.ethereum,
        trezorConnect,
    }),
    cardano: createCardanoSuiteNetworkModule({
        suiteCommonNetworkModule: suiteCommonNetworkModules.cardano,
        trezorConnect,
    }),
});

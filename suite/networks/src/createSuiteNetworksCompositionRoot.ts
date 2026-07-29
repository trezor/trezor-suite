import type TrezorConnect from '@trezor/connect';
import { createBitcoinSuiteNetworkModule } from '@trezor/network-bitcoin-suite';
import { createCardanoSuiteNetworkModule } from '@trezor/network-cardano-suite';
import { createEthereumSuiteNetworkModule } from '@trezor/network-ethereum-suite';
import type { SignVerifyCapabilityHelpers } from '@trezor/network-module-suite-types';

import type { SuiteNetworkModules } from './SuiteNetworkModules';

export type CreateSuiteNetworksCompositionRootDeps = {
    trezorConnect: typeof TrezorConnect;
    signVerifyHelpers: SignVerifyCapabilityHelpers;
};

export const createSuiteNetworksCompositionRoot = ({
    trezorConnect,
    signVerifyHelpers,
}: CreateSuiteNetworksCompositionRootDeps): SuiteNetworkModules => ({
    bitcoin: createBitcoinSuiteNetworkModule({
        trezorConnect,
        signVerifyHelpers,
    }),
    ethereum: createEthereumSuiteNetworkModule({
        trezorConnect,
        signVerifyHelpers,
    }),
    cardano: createCardanoSuiteNetworkModule({
        trezorConnect,
        signVerifyHelpers,
    }),
});

import { isWrappedNativeToken } from '@trezor/network-ethereum/constants';
import { ethereumAssets } from '@trezor/network-ethereum-assets';
import { supportedEthereumNetworks } from '@trezor/network-ethereum-types';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { createEthereumIcon } from './createEthereumIcon';
import {
    type EthereumNamedAddressResolverCompositionRootDeps,
    createEthereumNamedAddressResolverCompositionRoot,
} from './namedAddress/createEthereumNamedAddressResolverCompositionRoot';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

type EthereumSuiteCommonNetworkModuleDeps = EthereumNamedAddressResolverCompositionRootDeps;

type EthereumSuiteCommonNetworkModule = SuiteCommonNetworkModule;

export const createEthereumSuiteCommonNetworkModule = (
    deps: EthereumSuiteCommonNetworkModuleDeps,
): EthereumSuiteCommonNetworkModule => {
    const { ethereumNamedAddressResolver } =
        createEthereumNamedAddressResolverCompositionRoot(deps);

    return createNetworkModule(supportedEthereumNetworks, {
        icon: createEthereumIcon({ ethereumAssets, isWrappedNativeToken }),
        addressValidator: ethereumValidator,
        namedAddressResolver: ethereumNamedAddressResolver,
        getNetworkConfig,
        getAccountSyncInterval,
    });
};

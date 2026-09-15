import { supportedEthereumNetworks } from '@trezor/network-ethereum/constants';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    type EthereumNamedAddressResolverCompositionRootDeps,
    createEthereumNamedAddressResolverCompositionRoot,
} from './namedAddress/createEthereumNamedAddressResolverCompositionRoot';
import { getNetworkConfig } from './networkConfig';

type EthereumSuiteCommonNetworkModuleDeps = EthereumNamedAddressResolverCompositionRootDeps;

type EthereumSuiteCommonNetworkModule = SuiteCommonNetworkModule;

export const createEthereumSuiteCommonNetworkModule = (
    deps: EthereumSuiteCommonNetworkModuleDeps,
): EthereumSuiteCommonNetworkModule => {
    const { ethereumNamedAddressResolver } =
        createEthereumNamedAddressResolverCompositionRoot(deps);

    return createNetworkModule(supportedEthereumNetworks, {
        addressValidator: ethereumValidator,
        namedAddressResolver: ethereumNamedAddressResolver,
        getNetworkConfig,
    });
};

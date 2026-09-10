import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum/constants';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    type EthereumNamedAddressResolverCompositionRootDeps,
    createEthereumNamedAddressResolverCompositionRoot,
} from './namedAddress/createEthereumNamedAddressResolverCompositionRoot';
import { getNetworkConfig } from './networkConfig';

type EthereumSuiteCommonNetworkModuleDeps = EthereumNamedAddressResolverCompositionRootDeps;

export type EthereumNetworkSuiteCommonNetworkModule =
    SuiteCommonNetworkModule<EthereumNetworkSymbol>;

type EthereumSuiteCommonNetworkModule = EthereumNetworkSuiteCommonNetworkModule;

export const createEthereumSuiteCommonNetworkModule = (
    deps: EthereumSuiteCommonNetworkModuleDeps,
): EthereumSuiteCommonNetworkModule => {
    const { ethereumNamedAddressResolver } =
        createEthereumNamedAddressResolverCompositionRoot(deps);

    return {
        addressValidator: ethereumValidator,
        namedAddressResolver: ethereumNamedAddressResolver,
        getSupportedNetworks: () => supportedEthereumNetworks,
        isSupportedNetwork: isSupportedEthereumNetwork,
        getNetworkConfig,
    };
};

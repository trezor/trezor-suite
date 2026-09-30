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
import {
    type EthereumWalletConnectAdapterDeps,
    createEthereumWalletConnectAdapter,
} from './walletConnect/createEthereumWalletConnectAdapter';

type EthereumSuiteCommonNetworkModuleDeps = EthereumNamedAddressResolverCompositionRootDeps &
    EthereumWalletConnectAdapterDeps;

type EthereumSuiteCommonNetworkModule = SuiteCommonNetworkModule;

export const createEthereumSuiteCommonNetworkModule = (
    deps: EthereumSuiteCommonNetworkModuleDeps,
): EthereumSuiteCommonNetworkModule => {
    const { ethereumNamedAddressResolver } =
        createEthereumNamedAddressResolverCompositionRoot(deps);

    return createNetworkModule(supportedEthereumNetworks, {
        addressValidator: ethereumValidator,
        namedAddressResolver: ethereumNamedAddressResolver,
        walletConnectAdapter: createEthereumWalletConnectAdapter(deps),
        getNetworkConfig,
    });
};

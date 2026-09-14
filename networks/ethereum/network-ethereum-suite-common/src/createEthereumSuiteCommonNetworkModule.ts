import {
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
    toEthereumNetworkSymbol,
} from '@trezor/network-ethereum/constants';
import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module/constants';
import type {
    AddressValidator,
    NamedAddressResolver,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    type EthereumNamedAddressResolverCompositionRootDeps,
    createEthereumNamedAddressResolverCompositionRoot,
} from './namedAddress/createEthereumNamedAddressResolverCompositionRoot';
import { getNetworkConfig } from './networkConfig';

type EthereumSuiteCommonNetworkModuleDeps = EthereumNamedAddressResolverCompositionRootDeps;

type EthereumSuiteCommonNetworkModule = SuiteCommonNetworkModule;

const supportedNetworks = asNetworkSymbols(supportedEthereumNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        ethereumValidator.isAddressValid(address, toEthereumNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        ethereumValidator.getAddressType(address, toEthereumNetworkSymbol(symbol)),
};

export const createEthereumSuiteCommonNetworkModule = (
    deps: EthereumSuiteCommonNetworkModuleDeps,
): EthereumSuiteCommonNetworkModule => {
    const { ethereumNamedAddressResolver } =
        createEthereumNamedAddressResolverCompositionRoot(deps);

    const namedAddressResolver: NamedAddressResolver<NetworkSymbol> = {
        supportsNamedAddress: symbol =>
            ethereumNamedAddressResolver.supportsNamedAddress(toEthereumNetworkSymbol(symbol)),
        isNameLike: ethereumNamedAddressResolver.isNameLike,
        isAddressLike: ethereumNamedAddressResolver.isAddressLike,
        resolveNamedAddress: (value, symbol) =>
            ethereumNamedAddressResolver.resolveNamedAddress(
                value,
                toEthereumNetworkSymbol(symbol),
            ),
        reverseResolveAddress: (address, symbol) =>
            ethereumNamedAddressResolver.reverseResolveAddress(
                address,
                toEthereumNetworkSymbol(symbol),
            ),
    };

    return {
        addressValidator,
        namedAddressResolver,
        getSupportedNetworks: () => supportedNetworks,
        isSupportedNetwork: isSupportedEthereumNetwork,
        getNetworkConfig: symbol => getNetworkConfig(toEthereumNetworkSymbol(symbol)),
    };
};

import {
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
    toEthereumNetworkSymbol,
} from '@trezor/network-ethereum/constants';
import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module';
import type {
    AddressValidator,
    NamedAddressResolver,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { ethereumNamedAddressResolver } from './namedAddress/ethereumNamedAddressResolver';
import { getNetworkConfig } from './networkConfig';

const supportedNetworks = asNetworkSymbols(supportedEthereumNetworks);

const addressValidator: AddressValidator<NetworkSymbol> = {
    isAddressValid: (address, symbol) =>
        ethereumValidator.isAddressValid(address, toEthereumNetworkSymbol(symbol)),
    getAddressType: (address, symbol) =>
        ethereumValidator.getAddressType(address, toEthereumNetworkSymbol(symbol)),
};

const namedAddressResolver: NamedAddressResolver<NetworkSymbol> = {
    supportsNamedAddress: symbol =>
        ethereumNamedAddressResolver.supportsNamedAddress(toEthereumNetworkSymbol(symbol)),
    isNameLike: ethereumNamedAddressResolver.isNameLike,
    isAddressLike: ethereumNamedAddressResolver.isAddressLike,
    resolveNamedAddress: (value, symbol) =>
        ethereumNamedAddressResolver.resolveNamedAddress(value, toEthereumNetworkSymbol(symbol)),
    reverseResolveAddress: (address, symbol) =>
        ethereumNamedAddressResolver.reverseResolveAddress(
            address,
            toEthereumNetworkSymbol(symbol),
        ),
    resolveNamedProfile: (value, symbol, textKeys) =>
        ethereumNamedAddressResolver.resolveNamedProfile(
            value,
            toEthereumNetworkSymbol(symbol),
            textKeys,
        ),
};

const isTestnet = (symbol: NetworkSymbol): boolean =>
    getNetworkConfig(toEthereumNetworkSymbol(symbol)).testnet;

export const createEthereumSuiteCommonNetworkModule = (): SuiteCommonNetworkModule => ({
    addressValidator,
    namedAddressResolver,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: isSupportedEthereumNetwork,
    isTestnet,
    getNetworkConfig: symbol => getNetworkConfig(toEthereumNetworkSymbol(symbol)),
});

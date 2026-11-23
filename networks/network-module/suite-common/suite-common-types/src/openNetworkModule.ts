import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module-types';

import type { SuiteCommonNetworkModule } from './SuiteCommonNetworkModule';
import type { NetworkModule } from './createNetworkModule';
import { createNamedAddressResolver } from './namedAddressResolver/createNamedAddressResolver';
import { createNetworkSignVerify } from './signVerify/createNetworkSignVerify';

/**
 * Opens a network module for the shared layers, which pass the open `NetworkSymbol`.
 *
 * Each symbol is narrowed against the module's own supported networks before network behavior is
 * reached, so a symbol the module does not support is rejected at its edge.
 */
export const openNetworkModule = <TNetworkSymbol extends string>(
    networkModule: NetworkModule<TNetworkSymbol>,
): SuiteCommonNetworkModule => {
    const { isSupportedNetwork, isWrappedNativeToken, namedAddressResolver, signVerify } =
        networkModule;

    const narrow = (symbol: NetworkSymbol): TNetworkSymbol => {
        if (!isSupportedNetwork(symbol)) {
            throw new Error(
                `Unsupported network symbol: ${symbol}. Supported: ${networkModule.getSupportedNetworks().join(', ')}.`,
            );
        }

        return symbol;
    };

    return {
        icon: networkModule.icon,
        isWrappedNativeToken: isWrappedNativeToken
            ? (symbol, contract) => isWrappedNativeToken(narrow(symbol), contract)
            : undefined,
        addressValidator: {
            isAddressValid: (address, symbol) =>
                networkModule.addressValidator.isAddressValid(address, narrow(symbol)),
            getAddressType: (address, symbol) =>
                networkModule.addressValidator.getAddressType(address, narrow(symbol)),
        },
        namedAddressResolver:
            namedAddressResolver &&
            createNamedAddressResolver(namedAddressResolver, isSupportedNetwork, narrow),
        getSupportedNetworks: () => asNetworkSymbols(networkModule.getSupportedNetworks()),
        getNetworkConfig: symbol => networkModule.getNetworkConfig(narrow(symbol)),
        getAccountSyncInterval: symbol => networkModule.getAccountSyncInterval(narrow(symbol)),
        signVerify: signVerify && createNetworkSignVerify(signVerify, narrow),
    };
};

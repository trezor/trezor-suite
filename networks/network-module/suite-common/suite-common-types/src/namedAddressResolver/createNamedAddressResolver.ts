import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NamedAddressResolver } from './NamedAddressResolver';

export const createNamedAddressResolver = <TNetworkSymbol extends string>(
    resolver: NamedAddressResolver<TNetworkSymbol>,
    isSupportedNetwork: (symbol: string) => symbol is TNetworkSymbol,
    narrow: (symbol: NetworkSymbol) => TNetworkSymbol,
): NamedAddressResolver<NetworkSymbol> => ({
    supportsNamedAddress: symbol =>
        isSupportedNetwork(symbol) && resolver.supportsNamedAddress(symbol),
    isNameLike: resolver.isNameLike,
    isAddressLike: resolver.isAddressLike,
    resolveNamedAddress: async (value, symbol, options) =>
        await resolver.resolveNamedAddress(value, narrow(symbol), options),
    reverseResolveAddress: async (address, symbol, options) =>
        await resolver.reverseResolveAddress(address, narrow(symbol), options),
});

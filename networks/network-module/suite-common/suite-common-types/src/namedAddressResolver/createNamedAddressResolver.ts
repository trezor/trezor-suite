import {
    type NetworkSymbol,
    createNarrowAsync,
    isSupportedNetworkSymbol,
} from '@trezor/network-module-types';

import type { NamedAddressResolver } from './NamedAddressResolver';

export const createNamedAddressResolver = <TNetworkSymbol extends string>(
    resolver: NamedAddressResolver<TNetworkSymbol>,
    supportedNetworks: readonly TNetworkSymbol[],
): NamedAddressResolver<NetworkSymbol> => {
    const narrowAsync = createNarrowAsync(supportedNetworks);

    return {
        supportsNamedAddress: networkSymbol =>
            isSupportedNetworkSymbol(supportedNetworks, networkSymbol) &&
            resolver.supportsNamedAddress(networkSymbol),
        isNameLike: resolver.isNameLike,
        isAddressLike: resolver.isAddressLike,
        resolveNamedAddress: narrowAsync(resolver.resolveNamedAddress),
        reverseResolveAddress: narrowAsync(resolver.reverseResolveAddress),
    };
};

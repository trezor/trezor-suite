import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type { NamedAddressResolver } from '@trezor/network-module-suite-common-types';

import type { ResolveNamedAddressDep } from './ResolveNamedAddress';
import type { ReverseResolveAddressDep } from './ReverseResolveAddress';
import { isAddressLike, isNameLike, supportsNamedAddress } from './namedAddressUtils';

export type EthereumNamedAddressResolverDeps = ResolveNamedAddressDep & ReverseResolveAddressDep;

export type EthereumNamedAddressResolver = NamedAddressResolver<EthereumNetworkSymbol>;

export type EthereumNamedAddressResolverDep = {
    ethereumNamedAddressResolver: EthereumNamedAddressResolver;
};

export const createEthereumNamedAddressResolver = (
    deps: EthereumNamedAddressResolverDeps,
): EthereumNamedAddressResolver => ({
    supportsNamedAddress,
    isNameLike,
    isAddressLike,
    resolveNamedAddress: deps.resolveNamedAddress,
    reverseResolveAddress: deps.reverseResolveAddress,
});

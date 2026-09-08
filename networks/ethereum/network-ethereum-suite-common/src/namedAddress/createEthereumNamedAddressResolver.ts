import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type { NamedAddressResolver } from '@trezor/network-module-suite-common-types';

import { createResolveNamedAddress } from './createResolveNamedAddress';
import {
    type ResolveViaBlockbookDeps,
    createResolveViaBlockbook,
} from './createResolveViaBlockbook';
import type { UniversalResolverDeps } from './createUniversalResolver';
import { isAddressLike, isNameLike, supportsNamedAddress } from './namedAddressUtils';

export type EthereumNamedAddressResolverDeps = UniversalResolverDeps & ResolveViaBlockbookDeps;

export type EthereumNamedAddressResolver = NamedAddressResolver<EthereumNetworkSymbol>;

export type EthereumNamedAddressResolverDep = {
    ethereumNamedAddressResolver: EthereumNamedAddressResolver;
};

/**
 * Loaded on first use rather than imported: `@suite-common/networks` composes every network
 * module eagerly, so an eager import would load viem and `@suite-common/calldata`
 * for consumers that only need network configuration. Shape checks stay synchronous —
 * they are regexes the send form runs on every keystroke.
 */
export const createEthereumNamedAddressResolver = (
    deps: EthereumNamedAddressResolverDeps,
): EthereumNamedAddressResolver => {
    const loadResolver = async () => {
        const { createUniversalResolver } = await import('./createUniversalResolver');
        const universalResolver = createUniversalResolver(deps);

        return {
            ...universalResolver,
            resolveNamedAddress: createResolveNamedAddress({
                resolveNamedAddressOnchain: universalResolver.resolveNamedAddressOnchain,
                resolveViaBlockbook: createResolveViaBlockbook(deps),
            }),
        };
    };

    return {
        supportsNamedAddress,
        isNameLike,
        isAddressLike,

        resolveNamedAddress: async (value, symbol) =>
            (await loadResolver()).resolveNamedAddress(value, symbol),

        reverseResolveAddress: async (address, symbol) =>
            (await loadResolver()).reverseResolveAddressOnchain(address, symbol),
    };
};

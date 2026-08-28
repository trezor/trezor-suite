import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type { NamedAddressResolver } from '@trezor/network-module-suite-common-types';

import { isAddressLike, isNameLike, supportsNamedAddress } from './namedAddressUtils';

/**
 * Loaded on first use rather than imported: `@suite-common/networks` composes every network
 * module eagerly, so an eager import would put viem, `@suite-common/calldata` and
 * `@trezor/connect` in the module graph of everything that reaches for a network symbol. The
 * shape checks stay synchronous — they are regexes the send form runs on every keystroke.
 */
const loadResolver = () => import('./resolveNamedAddress');

export const ethereumNamedAddressResolver: NamedAddressResolver<EthereumNetworkSymbol> = {
    supportsNamedAddress,
    isNameLike,
    isAddressLike,

    resolveNamedAddress: async (value, symbol) =>
        (await loadResolver()).resolveNamedAddress(value, symbol),

    reverseResolveAddress: async (address, symbol) =>
        (await loadResolver()).reverseResolveAddressOnchain(address, symbol),

    resolveNamedProfile: async (value, symbol, textKeys) =>
        (await loadResolver()).resolveNamedProfileOnchain(value, symbol, textKeys),
};

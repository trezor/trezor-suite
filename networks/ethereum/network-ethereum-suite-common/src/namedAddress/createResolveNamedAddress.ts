import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';

import type { ResolveViaBlockbookDep } from './createResolveViaBlockbook';
import type { UniversalResolver } from './createUniversalResolver';

export type ResolveNamedAddressDeps = Pick<UniversalResolver, 'resolveNamedAddressOnchain'> &
    ResolveViaBlockbookDep;

export type ResolveNamedAddress = (
    value: string,
    symbol: EthereumNetworkSymbol,
) => Promise<string | null>;

export type ResolveNamedAddressDep = {
    resolveNamedAddress: ResolveNamedAddress;
};

/**
 * Forward-resolve a named input, preferring a direct UniversalResolver call over Blockbook's
 * descriptor-based resolution.
 *
 * A `null` result is a definitive "no record" answer, so only a thrown error — an unreachable
 * or erroring backend — is worth retrying through Blockbook.
 */
export const createResolveNamedAddress =
    (deps: ResolveNamedAddressDeps): ResolveNamedAddress =>
    async (value, symbol) => {
        try {
            return await deps.resolveNamedAddressOnchain(value, symbol);
        } catch {
            return deps.resolveViaBlockbook(value, symbol);
        }
    };

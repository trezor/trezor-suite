import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';

import { resolveViaBlockbook } from './resolveNamedAddressBB';
import { resolveNamedAddressOnchain } from './universalResolver';

/**
 * Forward-resolve a named input, preferring a direct UniversalResolver call over Blockbook's
 * descriptor-based resolution.
 *
 * A `null` result is a definitive "no record" answer, so only a thrown error — an unreachable
 * or erroring backend — is worth retrying through Blockbook.
 */
export const resolveNamedAddress = async (value: string, symbol: EthereumNetworkSymbol) => {
    try {
        return await resolveNamedAddressOnchain(value, symbol);
    } catch {
        return resolveViaBlockbook(value, symbol);
    }
};

// Re-exported so the resolver capability reaches the whole implementation through one import.
export { reverseResolveAddressOnchain } from './universalResolver';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import { resolveViaBlockbook } from './resolveNamedAddresBB';
import { resolveNamedAddressOnchain } from './universalResolver';

/**
 * Forward-resolve a named input, preferring a direct UniversalResolver call over Blockbook's
 * descriptor-based resolution.
 *
 * A `null` result is a definitive "no record" answer, so only a thrown error — an unreachable
 * or erroring backend — is worth retrying through Blockbook.
 */
export const resolveNamedAddress = async (value: string, symbol: NetworkSymbol) => {
    try {
        return await resolveNamedAddressOnchain(value, symbol);
    } catch {
        return resolveViaBlockbook(value, symbol);
    }
};

export {
    type NamedAddressProfile,
    resolveNamedProfileOnchain as resolveNamedProfile,
    reverseResolveAddressOnchain as reverseResolveAddress,
} from './universalResolver';

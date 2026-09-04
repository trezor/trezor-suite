import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import { scheduleAction } from '@trezor/utils';

import { resolveViaBlockbook } from './resolveNamedAddressBB';
import { ONCHAIN_CALL_TIMEOUT_MS, resolveNamedAddressOnchain } from './universalResolver';

/**
 * Total time one resolution may take. The onchain attempt can only spend its own share, so a
 * hung RPC leaves the fallback room to answer instead of consuming the whole budget — and a
 * send form waiting on a name is never held for longer than this.
 */
const RESOLUTION_BUDGET_MS = ONCHAIN_CALL_TIMEOUT_MS + 5_000;

/**
 * Forward-resolve a named input, preferring a direct UniversalResolver call over Blockbook's
 * descriptor-based resolution.
 *
 * A `null` result is a definitive "no record" answer, so only a thrown error — an unreachable
 * or erroring backend — is worth retrying through Blockbook.
 */
export const resolveNamedAddress = (value: string, symbol: EthereumNetworkSymbol) =>
    scheduleAction(
        async () => {
            try {
                return await resolveNamedAddressOnchain(value, symbol);
            } catch {
                return resolveViaBlockbook(value, symbol);
            }
        },
        // One attempt: retrying is the query layer's job, and doing it here would multiply
        // into its own retry.
        { attempts: 1, timeout: RESOLUTION_BUDGET_MS },
    );

// Re-exported so the resolver capability reaches the whole implementation through one import.
export { reverseResolveAddressOnchain } from './universalResolver';

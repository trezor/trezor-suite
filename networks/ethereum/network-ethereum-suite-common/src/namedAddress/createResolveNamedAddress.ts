import { scheduleAction } from '@trezor/utils';

import type { ResolveNamedAddress } from './ResolveNamedAddress';
import { ONCHAIN_CALL_TIMEOUT_MS } from './namedAddressUtils';

/**
 * Total time one resolution may take. The onchain attempt can only spend its own share, so a
 * hung RPC leaves the fallback room to answer instead of consuming the whole budget — and a
 * send form waiting on a name is never held for longer than this.
 */
const RESOLUTION_BUDGET_MS = ONCHAIN_CALL_TIMEOUT_MS + 5_000;

export type ResolveNamedAddressDeps = {
    resolveNamedAddressOnchain: ResolveNamedAddress;
    resolveViaBlockbook: ResolveNamedAddress;
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
    (value, symbol) =>
        scheduleAction(
            async () => {
                try {
                    return await deps.resolveNamedAddressOnchain(value, symbol);
                } catch {
                    return deps.resolveViaBlockbook(value, symbol);
                }
            },
            // One attempt: retrying is the query layer's job, and doing it here would multiply
            // into its own retry.
            { attempts: 1, timeout: RESOLUTION_BUDGET_MS },
        );

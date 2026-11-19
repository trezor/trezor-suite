import type { WardAcceptance, WardTransition } from '@trezor/ward';

import type { Log } from './logging';

/**
 * The state wardd persists: each ward's append-only transition log, and beside it the WM's
 * acceptance of the transitions it accepted. The head comes from the WM attestation or the
 * device's own anchor, and entries and proofs are replayed from the log.
 */
export type WardTransitionStore = {
    /** Idempotent: an identical record is a no-op; a different one at the same key is refused. */
    appendTransition(wardId: string, transition: WardTransition): void | Promise<void>;
    /** Every live transition of the ward, ascending by counter; abandoned candidates included. */
    getTransitions(wardId: string): WardTransition[] | Promise<WardTransition[]>;
    /** Idempotent like `appendTransition`, keyed by (counter, targetRoot). */
    appendAcceptance(wardId: string, acceptance: WardAcceptance): void | Promise<void>;
    getAcceptances(wardId: string): WardAcceptance[] | Promise<WardAcceptance[]>;
    dispose?(): void | Promise<void>;
};

/**
 * Keep the WM's acceptance beside the transition it finalizes, so a later revert of that
 * transition can show the device when the WM accepted it. The WM has already accepted, so a
 * failed write is logged and the publication goes on; the revert screen then shows no time.
 */
export const storeAcceptance = async (
    storage: WardTransitionStore,
    wardId: string,
    transition: WardTransition,
    accepted: { signature: string; timestamp: number },
    log: Log,
) => {
    try {
        await storage.appendAcceptance(wardId, {
            counter: transition.counter,
            targetRoot: transition.targetRoot,
            timestamp: accepted.timestamp,
            wmSignature: accepted.signature,
        });
    } catch (error) {
        log('acceptance.store.failed', {
            counter: transition.counter,
            reason: error instanceof Error ? error.message : 'unknown',
        });
    }
};

/**
 * Full-sync root catch-up: replays every entry queued for a wallet
 * (`OfflineQueueProvider.getQueueEntries`) through the device one at a time via the
 * low-level AuthDbUpdateLeaf wire message. Each entry already carries its own `mac`
 * (signed when it was originally queued), so no user re-approval is needed — but unlike
 * `authDbFastForwardRoot`, the device verifies every individual mutation that produced
 * the new root, not just the final checkpoint.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type AuthDbReplayQueueSchema = Static<typeof AuthDbReplayQueueSchema>;
export const AuthDbReplayQueueSchema = Type.Object({
    /** Identifies which wallet's queued entries to replay. */
    walletId: Type.String(),
});

export interface AuthDbReplayQueueResult {
    /** Number of queued entries successfully applied and cleared from the queue. */
    appliedCount: number;
    counter: number;
    root: string;
}

export declare function authDbReplayQueue(
    params: Params<AuthDbReplayQueueSchema>,
): Response<AuthDbReplayQueueResult>;

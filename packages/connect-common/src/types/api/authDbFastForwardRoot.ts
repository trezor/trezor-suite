/**
 * Skip-ahead ("fast-forward") root sync: sends the wallet's latest known checkpoint
 * to the device in one shot (via the low-level AuthDbSetRoot wire message) instead of
 * replaying every queued entry. The device verifies the checkpoint's `mac` and that its
 * `counter` increased, but does not see the individual entries that produced it — a
 * materially weaker guarantee than `authDbReplayQueue`. Intended for bootstrapping a
 * fresh/factory-reset device or deliberately trading replay cost for speed, not as the
 * default routine catch-up path.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type AuthDbFastForwardRootSchema = Static<typeof AuthDbFastForwardRootSchema>;
export const AuthDbFastForwardRootSchema = Type.Object({
    /** Identifies which wallet's root checkpoint to send. */
    walletId: Type.String(),
});

export interface AuthDbFastForwardRootResult {
    counter: number;
    identifier?: string;
}

export declare function authDbFastForwardRoot(
    params: Params<AuthDbFastForwardRootSchema>,
): Response<AuthDbFastForwardRootResult>;

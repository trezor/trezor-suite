/**
 * Skip-ahead ("fast-forward") root sync: sends the wallet's latest known root-attestation
 * checkpoint to the device via the production-safe AuthDbFastForwardRoot wire message
 * instead of replaying every queued entry. `mac` must be a root-attestation token
 * previously returned as AuthDbUpdateLeafResponse.mac or
 * AuthDbApplyOfflineOperationsResponse.root_mac; the device verifies it and that its
 * `counter` increased, but does not see the individual entries that produced it — a
 * materially weaker guarantee than `authDbReplayQueue`.
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
    walletId?: string;
}

export declare function authDbFastForwardRoot(
    params: Params<AuthDbFastForwardRootSchema>,
): Response<AuthDbFastForwardRootResult>;

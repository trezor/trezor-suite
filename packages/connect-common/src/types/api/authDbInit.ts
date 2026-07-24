/**
 * High-level AuthDB bootstrap/refresh. Drives the WARD sync round
 * (WARDSync → WARDIngestAttestation → WARDReconcile): the device mints a
 * nonce, the WM's freshness attestation over (counter, mac) is verified against it,
 * then the host-supplied `root` is adopted as the device's authenticated state.
 *
 * `counter`/`mac`/`root` are the WM-attested checkpoint (from Evolu/tree_state);
 * `mac`/`root` are omitted for an empty tree. The WM signature is produced with the
 * debug QM key for now (a real provisioned WM key is a follow-up).
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type AuthDbInitSchema = Static<typeof AuthDbInitSchema>;
export const AuthDbInitSchema = Type.Object({
    /** Attested global counter (counter_ext) the device should adopt. */
    counter: Type.Number(),
    /** mac_ext = MAC(mac_key, root||counter); omit for an empty tree. */
    mac: Type.Optional(Type.String()),
    /** The current authenticated root to adopt; omit for an empty tree. */
    root: Type.Optional(Type.String()),
    /** If given, the device's echoed wallet_id must match it (defense in depth). */
    walletId: Type.Optional(Type.String()),
});

export interface AuthDbInitResult {
    counter: number;
    root: string;
    /** wallet_id echoed by the device. */
    walletId?: string;
    /** HMAC root attestation for the installed (root, counter); absent if empty. */
    rootMac?: string;
}

export declare function authDbInit(params: Params<AuthDbInitSchema>): Response<AuthDbInitResult>;

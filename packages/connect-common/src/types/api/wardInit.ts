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

export type WardInitSchema = Static<typeof WardInitSchema>;
export const WardInitSchema = Type.Object({
    /** Attested global counter (counter_ext) the device should adopt. */
    counter: Type.Number(),
    /** mac_ext = MAC(mac_key, root||counter); omit for an empty tree. */
    mac: Type.Optional(Type.String()),
    /** The current authenticated root to adopt; omit for an empty tree. */
    root: Type.Optional(Type.String()),
    /** If given, the device's echoed ward_id must match it (defense in depth). */
    wardId: Type.Optional(Type.String()),
});

export interface WardInitResult {
    counter: number;
    root: string;
    /**
     * SLIP21-derived wardId echoed by the device. Callers should cache this and
     * pass it as `wardId` to subsequent wardUpdate / wardVerify
     * calls (it is the key the wardDataProvider is scoped by).
     */
    wardId?: string;
    /** HMAC root attestation for the installed (root, counter); absent if empty. */
    rootMac?: string;
}

export declare function wardInit(params: Params<WardInitSchema>): Response<WardInitResult>;

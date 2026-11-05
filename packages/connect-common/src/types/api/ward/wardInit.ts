/**
 * WARD sync: wardd runs the sync round on the device (WARDSync -> the WM's freshness
 * attestation over wardd's stored head -> WARDIngestAttestation -> WARDReconcile), installing
 * the stored root as the session's authenticated state. Connect only relays (see `wardd` in
 * ConnectSettings). Every other WARD method syncs first by itself.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../../params';

export type WardInitSchema = Static<typeof WardInitSchema>;
export const WardInitSchema = Type.Object({
    /** If given, the device's own ward_id must match it: it proves which wallet is unlocked. */
    wardId: Type.Optional(Type.String()),
});

export interface WardInitResult {
    /** The device's SLIP21-derived WM-facing anchor; wardd keeps each wallet under it. */
    wardId: string;
    counter: number;
    /** The installed root; '' for an empty tree. */
    root: string;
}

export declare function wardInit(params: Params<WardInitSchema>): Response<WardInitResult>;

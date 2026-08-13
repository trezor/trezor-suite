/**
 * High-level AuthDB update. Unlike the low-level WARD round
 * (wardSetEntry/wardCommit/wardFinalize), no Merkle proof is passed by the caller —
 * @trezor/connect computes it internally from the injected `wardDataProvider`
 * (see ConnectSettings.wardDataProvider) and drives the whole WARD write round.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type WardLabelSchema = Static<typeof WardLabelSchema>;
export const WardLabelSchema = Type.Object({
    label: Type.Optional(Type.String()),
    data: Type.Optional(Type.Unknown()),
    data_mac: Type.Optional(Type.String()),
});

export type WardUpdateSchema = Static<typeof WardUpdateSchema>;
export const WardUpdateSchema = Type.Object({
    /**
     * The domain (application) that owns this entry. The device forms the trie key
     * entry_key = sha256(appId || 0x00 || type || 0x00 || address), so a write for
     * one app can never collide with or overwrite another app's entry, and the domain
     * is shown on the trusted confirmation screen.
     */
    appId: Type.String(),
    address: Type.String(),
    networkSymbol: Type.String(),
    metadata: WardLabelSchema,
    /**
     * Request a FULL delete: the device removes the leaf from the trie and the host
     * drops the record. Explicit on purpose -- `metadata: {}` is an UPDATE to the value
     * `"<networkSymbol>:{}"`, not a delete, so clearing a label in a UI must not be
     * able to destroy the record by accident. `metadata` is ignored when this is set.
     */
    delete: Type.Optional(Type.Boolean()),
    /**
     * WM-facing wardId (SLIP21-derived) identifying which wallet's root checkpoint
     * this update belongs to; obtained from wardInit. The device echoes its own
     * ward_id and it must match (defense in depth).
     */
    wardId: Type.String(),
});

export interface WardUpdateResult {
    counter: number;
    root: string;
    /**
     * Set when the device committed the update but the local provider write
     * (upsert/setTreeState) failed afterwards — the device root is authoritative and
     * already reflects `counter`/`root` above, but the local cache is now stale. Callers
     * should react (e.g. resync from getAllEntries()) rather than assume it's up to date.
     */
    localCacheError?: string;
    /**
     * Set when the WM rejected the commit with a compare-and-set conflict (another
     * client advanced the ward head first). The stale device candidate was discarded;
     * `counter` carries the WM's current authoritative counter. The caller should
     * re-sync (wardInit) and retry the update.
     */
    conflict?: boolean;
}

export declare function wardUpdate(params: Params<WardUpdateSchema>): Response<WardUpdateResult>;

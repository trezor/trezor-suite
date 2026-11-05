/**
 * WARD write: wardd runs the write round on the device (sync -> WARDQueueUpdate -> WARDPerformUpdate,
 * answering the device's proof pull -> the WM's commit signature -> WARDConfirmedByWM) and stores
 * the leaf the device sealed. Connect only relays (see `wardd` in ConnectSettings).
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../../params';

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
    /** If given, the device's own ward_id must match it: it proves which wallet is unlocked. */
    wardId: Type.Optional(Type.String()),
});

export interface WardUpdateResult {
    wardId: string;
    counter: number;
    root: string;
    /**
     * Set when the device committed the update but wardd failed to store it
     * afterwards — the device root is authoritative and
     * already reflects `counter`/`root` above, but the local cache is now stale. Callers
     * should resync before the next write rather than assume it is up to date.
     */
    localCacheError?: string;
    /**
     * Set when the WM rejected the commit with a compare-and-set conflict (another
     * client advanced the ward head first). The stale device candidate was discarded;
     * `counter` carries the WM's current authoritative counter. The caller should
     * retry the update (it syncs first).
     */
    conflict?: boolean;
}

export declare function wardUpdate(params: Params<WardUpdateSchema>): Response<WardUpdateResult>;

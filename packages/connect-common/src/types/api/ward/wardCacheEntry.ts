/**
 * WARD offline cache: copy one entry of the synchronized tree into the device's offline cache.
 * wardd syncs the device, then the device pulls the proof for `entryKey`, verifies it against its
 * authenticated root, and stores the entry in the offline store of the app the entry belongs to
 * (the entry key binds that app). Nothing of the entry comes back. Connect only relays.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../../params';

export type WardCacheEntrySchema = Static<typeof WardCacheEntrySchema>;
export const WardCacheEntrySchema = Type.Object({
    /** The entry's 32-byte trie path, as hex. */
    entryKey: Type.String({ pattern: '^[0-9a-fA-F]{64}$' }),
    /** Keep it in the offline cache even after WARD deletes it. */
    sticky: Type.Optional(Type.Boolean()),
    /** If given, the device's own ward_id must match it: it proves which wallet is unlocked. */
    wardId: Type.Optional(Type.String()),
});

export interface WardCacheEntryResult {
    wardId: string;
    /** A cached record for the same entry was overwritten. */
    replaced: boolean;
    /** The device counter of the root the entry was proven against. */
    counter: number;
}

export declare function wardCacheEntry(
    params: Params<WardCacheEntrySchema>,
): Response<WardCacheEntryResult>;

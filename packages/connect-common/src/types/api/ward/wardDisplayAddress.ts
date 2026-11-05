/**
 * Show an address on the device with its WARD-authenticated label (PULL model). wardd syncs
 * the session, then Connect sends DisplayAddress and answers the device's WARDProofRequest
 * through wardd; the device verifies against its authenticated root and renders the label
 * on the trusted address screen.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../../params';

export type WardDisplayAddressSchema = Static<typeof WardDisplayAddressSchema>;
export const WardDisplayAddressSchema = Type.Object({
    /** The domain (application) whose label to display; the device forms
     * entry_key = sha256(appId || 0x00 || type || 0x00 || address). Must match the
     * domain the entry was written under (e.g. via wardUpdate). */
    appId: Type.String(),
    address: Type.String(),
    networkSymbol: Type.String(),
    /** If given, the device's own ward_id must match it: it proves which wallet is unlocked. */
    wardId: Type.Optional(Type.String()),
});

export interface WardDisplayAddressResult {
    /** true once the device has shown the address+label screen. */
    shown: boolean;
    /** ward_id of the synced wallet. */
    wardId: string;
}

export declare function wardDisplayAddress(
    params: Params<WardDisplayAddressSchema>,
): Response<WardDisplayAddressResult>;

/**
 * Show an address on the device with its WARD-authenticated label (PULL model).
 * @trezor/connect builds the membership / non-membership proof internally from the
 * injected `wardDataProvider` and answers the device's WARDProofRequest with it; the
 * device verifies against its authenticated root and renders the label on the
 * trusted address screen. Unlike wardVerify (a screenless verification query), this
 * drives the DisplayAddress flow so the label is shown to the user.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type WardDisplayAddressSchema = Static<typeof WardDisplayAddressSchema>;
export const WardDisplayAddressSchema = Type.Object({
    /** The domain (application) whose label to display; the device forms
     * entry_key = sha256(appId || 0x00 || type || 0x00 || address). Must match the
     * domain the entry was written under (e.g. via wardUpdate). */
    appId: Type.String(),
    address: Type.String(),
    networkSymbol: Type.String(),
    /**
     * WM-facing wardId (SLIP21-derived) identifying which wallet's root to verify
     * the label against; obtained from wardInit. The device echoes its own ward_id
     * and it must match (defense in depth).
     */
    wardId: Type.String(),
});

export interface WardDisplayAddressResult {
    /** true once the device has shown the address+label screen. */
    shown: boolean;
    /** whether the address had a label entry (membership) vs. absent (non-membership). */
    isMember: boolean;
    /** ward_id echoed by the device. */
    wardId?: string;
}

export declare function wardDisplayAddress(
    params: Params<WardDisplayAddressSchema>,
): Response<WardDisplayAddressResult>;

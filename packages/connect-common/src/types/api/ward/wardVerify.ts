/**
 * WARD verification: the device's verdict on whether (appId, address) is in its authenticated
 * tree -- wardd's lookup flow without the label (see wardLookup). Connect only relays.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../../params';

export type WardVerifySchema = Static<typeof WardVerifySchema>;
export const WardVerifySchema = Type.Object({
    /** The domain (application) to verify against; the device forms
     * entry_key = sha256(appId || 0x00 || type || 0x00 || address). */
    appId: Type.String(),
    address: Type.String(),
    networkSymbol: Type.String(),
    /** If given, the device's own ward_id must match it: it proves which wallet is unlocked. */
    wardId: Type.Optional(Type.String()),
});

export interface WardVerifyResult {
    isMember: boolean;
    valid: boolean;
    counter: number;
    /** ward_id echoed by the device. */
    wardId: string;
}

export declare function wardVerify(params: Params<WardVerifySchema>): Response<WardVerifyResult>;

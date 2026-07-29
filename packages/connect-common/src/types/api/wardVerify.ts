/**
 * High-level AuthDB verification. Unlike wardLookup, no Merkle proof is passed
 * by the caller — @trezor/connect computes the membership or non-membership proof
 * internally from the injected `wardDataProvider` (see
 * ConnectSettings.wardDataProvider).
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type WardVerifySchema = Static<typeof WardVerifySchema>;
export const WardVerifySchema = Type.Object({
    address: Type.String(),
    networkSymbol: Type.String(),
    /**
     * WM-facing wardId (SLIP21-derived) identifying which wallet's root checkpoint
     * to verify against; obtained from wardInit. The device echoes its own
     * ward_id and it must match (defense in depth).
     */
    wardId: Type.String(),
});

export interface WardVerifyResult {
    isMember: boolean;
    valid: boolean;
    counter: number;
    /** ward_id echoed by the device (online path only). */
    wardId?: string;
}

export declare function wardVerify(params: Params<WardVerifySchema>): Response<WardVerifyResult>;

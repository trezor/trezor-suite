/**
 * High-level AuthDB verification. Unlike authDbLookup, no Merkle proof is passed
 * by the caller — @trezor/connect computes the membership or non-membership proof
 * internally from the injected `authLabelLookupProvider` (see
 * ConnectSettings.authLabelLookupProvider).
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type AuthDbVerifyAddressSchema = Static<typeof AuthDbVerifyAddressSchema>;
export const AuthDbVerifyAddressSchema = Type.Object({
    address: Type.String(),
    networkSymbol: Type.String(),
    /** Identifies which wallet's root checkpoint to verify against. */
    walletId: Type.String(),
});

export interface AuthDbVerifyAddressResult {
    isMember: boolean;
    valid: boolean;
    counter: number;
    /** wallet_id echoed by the device (online path only). */
    walletId?: string;
}

export declare function authDbVerifyAddress(
    params: Params<AuthDbVerifyAddressSchema>,
): Response<AuthDbVerifyAddressResult>;

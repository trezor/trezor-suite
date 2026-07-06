/**
 * High-level AuthDB pre-approval. The device signs off on an old_value->new_value
 * transition for this address in advance, so a later `authDbUpdateAddress` call for
 * this exact transition can skip the on-device confirmation by auto-picking up this
 * approval (see `AuthLabelApprovalProvider.lookupApproval`). `metadata` is the
 * *proposed* new metadata — @trezor/connect reads the current (old) value from the
 * injected `authLabelLookupProvider` (see ConnectSettings.authLabelLookupProvider) and
 * computes the same counter progression `authDbUpdateAddress` would, so the approved
 * transition matches exactly what a real subsequent update presents.
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';
import { AuthDbAuthLabelMetadataSchema } from './authDbUpdateAddress';

export type AuthDbApproveAddressSchema = Static<typeof AuthDbApproveAddressSchema>;
export const AuthDbApproveAddressSchema = Type.Object({
    address: Type.String(),
    networkSymbol: Type.String(),
    metadata: AuthDbAuthLabelMetadataSchema,
    /** Identifies which wallet's entry to look up and approve. */
    walletId: Type.String(),
});

export interface AuthDbApproveAddressResult {
    mac: string;
    /** wallet_id echoed by the device — pass through as-is to a later setApproval() call. */
    deviceId: string;
}

export declare function authDbApproveAddress(
    params: Params<AuthDbApproveAddressSchema>,
): Response<AuthDbApproveAddressResult>;

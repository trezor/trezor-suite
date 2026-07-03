/**
 * High-level AuthDB pre-approval. The device signs off on the address's current
 * locally-stored value in advance, so a later `authDbUpdateAddress` call for the same
 * address can skip the on-device confirmation by auto-picking up this approval (see
 * `AuthLabelApprovalProvider.lookupApproval`). Unlike `authDbApprove`, no `value` is
 * passed by the caller — @trezor/connect reads it from the injected
 * `authLabelLookupProvider` (see ConnectSettings.authLabelLookupProvider).
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type AuthDbApproveAddressSchema = Static<typeof AuthDbApproveAddressSchema>;
export const AuthDbApproveAddressSchema = Type.Object({
    address: Type.String(),
    networkSymbol: Type.String(),
});

export interface AuthDbApproveAddressResult {
    mac: string;
    deviceId: string;
}

export declare function authDbApproveAddress(
    params: Params<AuthDbApproveAddressSchema>,
): Response<AuthDbApproveAddressResult>;

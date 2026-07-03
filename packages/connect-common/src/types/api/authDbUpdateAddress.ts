/**
 * High-level AuthDB update. Unlike authDbUpdateLeaf, no Merkle proof is passed by
 * the caller — @trezor/connect computes it internally from the injected
 * `authLabelLookupProvider` (see ConnectSettings.authLabelLookupProvider).
 */

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type AuthDbAuthLabelMetadataSchema = Static<typeof AuthDbAuthLabelMetadataSchema>;
export const AuthDbAuthLabelMetadataSchema = Type.Object({
    label: Type.Optional(Type.String()),
    data: Type.Optional(Type.Unknown()),
    data_mac: Type.Optional(Type.String()),
});

export type AuthDbUpdateAddressSchema = Static<typeof AuthDbUpdateAddressSchema>;
export const AuthDbUpdateAddressSchema = Type.Object({
    address: Type.String(),
    networkSymbol: Type.String(),
    metadata: AuthDbAuthLabelMetadataSchema,
});

export interface AuthDbUpdateAddressResult {
    counter: number;
    root: string;
}

export declare function authDbUpdateAddress(
    params: Params<AuthDbUpdateAddressSchema>,
): Response<AuthDbUpdateAddressResult>;

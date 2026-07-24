/**
 * High-level AuthDB update. Unlike the low-level WARD round
 * (wardSetEntry/wardCommit/wardFinalize), no Merkle proof is passed by the caller —
 * @trezor/connect computes it internally from the injected `authLabelLookupProvider`
 * (see ConnectSettings.authLabelLookupProvider) and drives the whole WARD write round.
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
    /** Identifies which wallet's root checkpoint this update belongs to. */
    walletId: Type.String(),
});

export interface AuthDbUpdateAddressResult {
    counter: number;
    root: string;
    /**
     * Set when the device committed the update but the local provider write
     * (upsert/setTreeState) failed afterwards — the device root is authoritative and
     * already reflects `counter`/`root` above, but the local cache is now stale. Callers
     * should react (e.g. resync from getAllEntries()) rather than assume it's up to date.
     */
    localCacheError?: string;
}

export declare function authDbUpdateAddress(
    params: Params<AuthDbUpdateAddressSchema>,
): Response<AuthDbUpdateAddressResult>;

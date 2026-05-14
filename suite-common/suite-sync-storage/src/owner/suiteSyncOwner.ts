import { type Branded } from '@trezor/type-utils';

/**
 * This is identifier of the SuiteSync user. We generate an Owner for every
 * wallet (seed+passphrase). It is deterministically derived from the secret
 * in Trezor Device (seed+passphrase).
 *
 * This can be calculated from SuiteSyncOwnerSecretHex.
 */
export type SuiteSyncOwnerId = string & Branded<SuiteSyncOwnerId>;
export const asSuiteSyncOwnerId = (value: string) => value as SuiteSyncOwnerId;

/**
 * This is an SLIP21 node, it is provided by Trezor Device
 * (derived from the wallets secret)
 */
export type SuiteSyncOwnerSecretHex = string & Branded<SuiteSyncOwnerSecretHex>;
export const asSuiteSyncOwnerSecretHex = (value: string) => value as SuiteSyncOwnerSecretHex;

export type SuiteSyncOwner = {
    ownerId: SuiteSyncOwnerId;
    ownerSecret: SuiteSyncOwnerSecretHex;
};

/**
 * JSON.stringify(SuiteSyncOwner)
 */
export type SuiteSyncOwnerSerialized = string & Branded<'SuiteSyncOwnerSerialized'>;
export const serializeSuiteSyncOwner = (value: SuiteSyncOwner) =>
    JSON.stringify(value) as SuiteSyncOwnerSerialized;
export const deserializeSuiteSyncOwner = (value: SuiteSyncOwnerSerialized) =>
    JSON.parse(value) as SuiteSyncOwner;

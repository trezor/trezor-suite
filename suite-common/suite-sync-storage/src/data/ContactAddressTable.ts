import { type Branded } from '@trezor/type-utils';

import { type SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncContactAddressId = string & Branded<'SuiteSyncContactAddressId'>;

export type CreateSuiteSyncContactAddressIdParams = {
    npub: string;
    slip44: number;
    address: string;
};

export const createSuiteSyncContactAddressId = ({
    npub,
    slip44,
    address,
}: CreateSuiteSyncContactAddressIdParams) =>
    `${npub}-${slip44}-${address}` as SuiteSyncContactAddressId;

/**
 * An address a contact's Trezor attested as theirs: `signature` is the contact identity's
 * BIP-340 signature over the address and its network's SLIP-44 coin type.
 */
export type SuiteSyncContactAddress = {
    id: SuiteSyncContactAddressId;
    npub: string;
    slip44: number;
    address: string;
    signature: string;
    /** Set once the wallet paid the address; a contact address is paid once. */
    isSpent: boolean;
};

export type ContactAddressTable = SuiteSyncTable<SuiteSyncContactAddress>;

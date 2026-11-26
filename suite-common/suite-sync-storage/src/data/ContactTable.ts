import { type Branded } from '@trezor/type-utils';

import { type SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncContactId = string & Branded<'SuiteSyncContactId'>;

/** One row per contact identity, so two Suites adding the same contact write the same row. */
export const createSuiteSyncContactId = (npub: string) => npub as SuiteSyncContactId;

/**
 * Someone the wallet pays by name. `npub` is the `npub1…` encoding of the contact's identity
 * key; `name` is what the wallet's Trezor shows for it.
 */
export type SuiteSyncContact = {
    id: SuiteSyncContactId;
    npub: string;
    name: string;
    /** A removed contact stays as a deleted row, so the removal syncs too. */
    isDeleted: boolean;
};

export type ContactTable = SuiteSyncTable<SuiteSyncContact>;

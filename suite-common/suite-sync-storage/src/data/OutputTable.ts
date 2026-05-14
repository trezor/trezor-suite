import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, type TxTargetId } from '@suite-common/wallet-types';
import { type Branded } from '@trezor/type-utils';

import { type SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncOutputId = string & Branded<'SuiteSyncOutputId'>;

export const createSuiteSyncOutputId = (txId: string, txTargetId: TxTargetId) =>
    `${txId}-${txTargetId}` as SuiteSyncOutputId;

/**
 * This shall be renamed to Target table, probably. As this may also allow to name
 * not just output, but also input.
 */
export type SuiteSyncOutput = {
    id: SuiteSyncOutputId;
    txId: string;

    /**
     * This is not just index, for tokens, it may be Contract Address, etc...
     * It is a number index only for bitcoin-like networks
     */
    txTargetId: TxTargetId;

    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type OutputTable = SuiteSyncTable<SuiteSyncOutput>;

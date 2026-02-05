import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { Branded } from '@trezor/type-utils';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncOutputId = string & Branded<'SuiteSyncOutputId'>;

export const createSuiteSyncOutputId = (txId: string, outputIndex: string) =>
    `${txId}-${outputIndex}` as SuiteSyncOutputId;

export type SuiteSyncOutput = {
    id: SuiteSyncOutputId;
    txId: string;

    /**
     * This is not just index, for tokens, it may be Contract Address, etc...
     * It is a number index only for bitcoin-like networks
     */
    outputIndex: string;

    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type OutputTable = SuiteSyncTable<SuiteSyncOutput>;

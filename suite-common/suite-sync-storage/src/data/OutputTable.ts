import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { Branded } from '@trezor/type-utils';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncOutputId = string & Branded<'SuiteSyncOutputId'>;

export const createSuiteSyncOutputId = (txId: string, outputIndex: number) =>
    `${txId}-${outputIndex}` as SuiteSyncOutputId;

export type SuiteSyncOutput = {
    id: SuiteSyncOutputId;
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type OutputTable = SuiteSyncTable<SuiteSyncOutput>;

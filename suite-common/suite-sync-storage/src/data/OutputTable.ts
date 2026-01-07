import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncOutput = {
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type OutputTable = SuiteSyncTable<SuiteSyncOutput>;

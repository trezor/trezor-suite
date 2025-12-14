import type { NetworkSymbol } from '@suite-common/wallet-config';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type OutputLabel = {
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export type OutputTable = SuiteSyncTable<OutputLabel>;

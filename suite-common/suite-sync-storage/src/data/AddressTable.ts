import type { NetworkSymbol } from '@suite-common/wallet-config';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncAddress = {
    address: string;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export type AddressTable = SuiteSyncTable<SuiteSyncAddress>;

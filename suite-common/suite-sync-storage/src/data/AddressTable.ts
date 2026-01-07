import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncAddress = {
    address: string;
    label: string | null;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export type AddressTable = SuiteSyncTable<SuiteSyncAddress>;

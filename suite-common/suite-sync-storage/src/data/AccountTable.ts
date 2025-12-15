import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncAccount = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    label: string | null;
    isHidden: boolean;
};

export type AccountTable = SuiteSyncTable<SuiteSyncAccount>;

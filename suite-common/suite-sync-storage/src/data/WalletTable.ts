import { type WalletDescriptor } from '@suite-common/wallet';

import { type SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncWallet = {
    walletDescriptor: WalletDescriptor; // This is primary ID
    label: string | null;
};

export type WalletTable = SuiteSyncTable<SuiteSyncWallet>;

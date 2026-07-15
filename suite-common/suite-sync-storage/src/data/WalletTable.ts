import { type WalletDescriptor } from '@trezor/device-utils';

import { type SuiteSyncTable } from '../SuiteSyncTable';

export type SuiteSyncWallet = {
    walletDescriptor: WalletDescriptor; // This is primary ID
    label: string | null;
};

export type WalletTable = SuiteSyncTable<SuiteSyncWallet>;

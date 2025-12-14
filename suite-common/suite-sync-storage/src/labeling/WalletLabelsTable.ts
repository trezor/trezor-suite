import { WalletDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncTable } from '../SuiteSyncTable';

export type WalletLabel = {
    walletDescriptor: WalletDescriptor;
    label: string | null;
};

export type WalletLabelsTable = SuiteSyncTable<WalletLabel>;

import type { SuiteSyncAccount } from './AccountTable';
import type { SuiteSyncAddress } from './AddressTable';
import { SuiteSyncOutput } from './OutputTable';
import type { SuiteSyncWallet } from './WalletTable';

export type SuiteSyncSchema = {
    wallets: SuiteSyncWallet;
    accounts: SuiteSyncAccount;
    addresses: SuiteSyncAddress;
    outputs: SuiteSyncOutput;
};

import type { SuiteSyncAccount } from './AccountTable';
import type { SuiteSyncAddress } from './AddressTable';
import type { SuiteSyncContactAddress } from './ContactAddressTable';
import type { SuiteSyncContact } from './ContactTable';
import { type SuiteSyncOutput } from './OutputTable';
import type { SuiteSyncWallet } from './WalletTable';

export type SuiteSyncSchema = {
    wallets: SuiteSyncWallet;
    accounts: SuiteSyncAccount;
    addresses: SuiteSyncAddress;
    outputs: SuiteSyncOutput;
    contacts: SuiteSyncContact;
    contactAddresses: SuiteSyncContactAddress;
};

import type { DBWalletAccountTransaction } from '../definitions';

export type DBWalletAccountTransactionCompatible = {
    order: DBWalletAccountTransaction['order'];
    tx: DBWalletAccountTransaction['tx'] & { totalSpent: string };
};

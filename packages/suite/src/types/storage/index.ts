import { AccountTransaction } from 'trezor-connect';

export interface WalletAccountTransaction extends AccountTransaction {
    id?: number;
    accountId: number;
}

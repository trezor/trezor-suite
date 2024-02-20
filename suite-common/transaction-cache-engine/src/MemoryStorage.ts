/* eslint-disable require-await */
import { A, F, pipe } from '@mobily/ts-belt';

import { AccountTransaction } from '@trezor/connect';

import { AccountUniqueKey, AccountUniqueParams, TransactionCacheEngineStorage } from './types';
import { getAccountUniqueKey } from './utils/asyncUtils';

/**
 * This class is used to store accounts and transactions in memory. Mostly for debugging purposes. It's not recommended to use it in production, use some storage that persists data instead.
 */
export class MemoryStorage implements TransactionCacheEngineStorage {
    accounts: Record<AccountUniqueKey, AccountUniqueParams> = {};
    accountTransactions: Record<AccountUniqueKey, AccountTransaction[]> = {};

    constructor() {
        this.init();
    }

    async init() {
        // TODO: init storage
    }

    async accountExist(account: AccountUniqueParams) {
        const accountUniqueKey = getAccountUniqueKey(account);

        return !!this.accounts[accountUniqueKey];
    }

    async saveAccount(account: AccountUniqueParams) {
        if (await this.accountExist(account)) {
            return;
        }
        const accountUniqueKey = getAccountUniqueKey(account);
        this.accounts[accountUniqueKey] = account;
    }

    async removeAccount({ coin, descriptor }: AccountUniqueParams) {
        const accountUniqueKey = getAccountUniqueKey({ coin, descriptor });

        delete this.accountTransactions[accountUniqueKey];
        delete this.accounts[accountUniqueKey];
    }

    async saveTransactions({
        account,
        transactions,
    }: {
        account: AccountUniqueParams;
        transactions: AccountTransaction[];
    }) {
        if (!(await this.accountExist(account))) {
            throw new Error(
                `Adding transactions for account that does not exist ${JSON.stringify(account)}`,
            );
        }

        const accountUniqueKey = getAccountUniqueKey(account);
        const existingTransactions = this.accountTransactions[accountUniqueKey] || [];

        this.accountTransactions[accountUniqueKey] = pipe(
            transactions,
            A.filter(({ txid }) => !existingTransactions.find(t => t.txid === txid)),
            A.concat(existingTransactions),
            F.toMutable,
        );
    }

    async getNumberOfExistingTransactions({
        coin,
        descriptor,
        txids,
    }: AccountUniqueParams & {
        txids: string[];
    }): Promise<number> {
        const existingTxids = this.getAccountTxids({ coin, descriptor });

        return txids.filter(txid => existingTxids.includes(txid)).length;
    }

    async getAccounts(): Promise<AccountUniqueParams[]> {
        // This function should return all accounts that are saved in the storage.
        return Object.values(this.accounts);
    }

    async getTransactions({
        coin,
        descriptor,
    }: AccountUniqueParams): Promise<AccountTransaction[]> {
        const accountUniqueKey = getAccountUniqueKey({ coin, descriptor });

        return this.accountTransactions[accountUniqueKey] || [];
    }

    private getAccountTxids(account: AccountUniqueParams) {
        const accountUniqueKey = getAccountUniqueKey(account);
        const transactions = this.accountTransactions[accountUniqueKey] || [];

        return transactions.map(t => t.txid);
    }
}

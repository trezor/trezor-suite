import BigNumber from 'bignumber.js';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountTransaction, AccountInfo } from '@trezor/connect';

export type AccountUniqueKey = `${NetworkSymbol}-${AccountInfo['descriptor']}` & {
    __accountKey: 'AccountKey';
};

export type AccountUniqueParams = {
    coin: NetworkSymbol;
    descriptor: AccountInfo['descriptor'];
};

export type AccountBalanceHistory = {
    time: number;
    txs: number;
    received: BigNumber;
    sent: BigNumber;
    sentToSelf: BigNumber;
};

export interface TransactionCacheEngineStorage {
    init(): Promise<void>;
    accountExist(accountParams: AccountUniqueParams): Promise<boolean>;
    saveAccount(accountParams: AccountUniqueParams): Promise<void>;
    removeAccount(accountParams: AccountUniqueParams): Promise<void>;
    saveTransactions(params: {
        account: AccountUniqueParams;
        transactions: AccountTransaction[];
    }): Promise<void>;
    getNumberOfExistingTransactions(
        params: {
            txids: string[];
        } & AccountUniqueParams,
    ): Promise<number>;
    getAccounts(): Promise<AccountUniqueParams[]>;
    getTransactions(params: AccountUniqueParams): Promise<AccountTransaction[]>;
}

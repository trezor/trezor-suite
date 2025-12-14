import { createAction } from '@reduxjs/toolkit';

import { Account, AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import { AccountTransaction } from '@trezor/connect';

export const TRANSACTIONS_MODULE_PREFIX = '@common/wallet-core/transactions';

const resetTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/resetTransaction`,
    (payload: { account: Account }) => ({ payload }),
);

const replaceTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/replaceTransaction`,
    (payload: {
        key: string;
        txid: string; // Original transactionId to be replaced
        tx: WalletAccountTransaction; // Transaction that replaces the original one
    }) => ({ payload }),
);

const removeTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/removeTransaction`,
    (payload: { account: Account; txs: { txid: string }[] }) => ({ payload }),
);

type AddTransactionActionProps = {
    transactions: (AccountTransaction & Partial<WalletAccountTransaction>)[];
    account: Account;
    page?: number;
    perPage?: number;
};

type AddTransactionActionResult = {
    payload: {
        transactions: WalletAccountTransaction[];
        account: Account;
        page?: number;
        perPage?: number;
    };
};

const addTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/addTransaction`,
    ({
        transactions,
        account,
        page,
        perPage,
    }: AddTransactionActionProps): AddTransactionActionResult => ({
        payload: {
            transactions: transactions.map(t => enhanceTransaction(t, account)),
            account,
            page,
            perPage,
        },
    }),
);

type SetOutputLabelActionParams = {
    accountKey: AccountKey;
    txid: string;
    outputIndex: number;
    label: string | null;
};

const setOutputLabel = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/setOutputLabel`,
    ({ accountKey, txid, outputIndex, label }: SetOutputLabelActionParams) => ({
        payload: { accountKey, txid, outputIndex, label },
    }),
);

export const transactionsActions = {
    addTransaction,
    replaceTransaction,
    removeTransaction,
    resetTransaction,
    setOutputLabel,
} as const;

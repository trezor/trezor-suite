import { createAction } from '@reduxjs/toolkit';

import { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import { AccountTransaction } from '@trezor/connect';
import { enhanceTransaction } from '@suite-common/wallet-utils';

export const TRANSACTIONS_MODULE_PREFIX = '@common/wallet-core/transactions';

const fetchError = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/fetchError`,
    (payload: { error: string | null }) => ({ payload }),
);
const fetchSuccess = createAction(`${TRANSACTIONS_MODULE_PREFIX}/fetchSuccess`);
const fetchInit = createAction(`${TRANSACTIONS_MODULE_PREFIX}/fetchInit`);

type UpdateTransactionFiatRatePayload = Array<{
    txid: string;
    account: Account;
    updateObject: Partial<WalletAccountTransaction>;
    ts: number;
}>;

const updateTransactionFiatRate = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/updateTransactionFiatRate`,
    (payload: UpdateTransactionFiatRatePayload) => ({
        payload,
    }),
);

const resetTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/resetTransaction`,
    (payload: { account: Account }) => ({ payload }),
);

const replaceTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/replaceTransaction`,
    (payload: { key: string; txid: string; tx: WalletAccountTransaction }) => ({ payload }),
);

const removeTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/removeTransaction`,
    (payload: { account: Account; txs: { txid: string }[] }) => ({ payload }),
);

const addTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/addTransaction`,
    ({
        transactions,
        account,
        page,
        perPage,
    }: {
        transactions: (AccountTransaction & Partial<WalletAccountTransaction>)[];
        account: Account;
        page?: number;
        perPage?: number;
    }): {
        payload: {
            transactions: WalletAccountTransaction[];
            account: Account;
            page?: number;
            perPage?: number;
        };
    } => ({
        payload: {
            transactions: transactions.map(t => enhanceTransaction(t, account)),
            account,
            page,
            perPage,
        },
    }),
);

export const transactionsActions = {
    addTransaction,
    fetchError,
    fetchInit,
    fetchSuccess,
    replaceTransaction,
    removeTransaction,
    resetTransaction,
    updateTransactionFiatRate,
} as const;

import { createAction } from '@reduxjs/toolkit';

import { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import { AccountTransaction } from '@trezor/connect';
import { enhanceTransaction } from '@suite-common/wallet-utils';

export const transactionsActionsPrefix = '@common/wallet-core/transactions';

const fetchError = createAction(
    `${transactionsActionsPrefix}/fetchError`,
    (payload: { error: string | null }) => ({ payload }),
);
const fetchSuccess = createAction(`${transactionsActionsPrefix}/fetchSuccess`);
const fetchInit = createAction(`${transactionsActionsPrefix}/fetchInit`);

type UpdateTransactionFiatRatePayload = Array<{
    txid: string;
    account: Account;
    updateObject: Partial<WalletAccountTransaction>;
    ts: number;
}>;

const updateTransactionFiatRate = createAction(
    `${transactionsActionsPrefix}/updateTransactionFiatRate`,
    (payload: UpdateTransactionFiatRatePayload) => ({
        payload,
    }),
);

const resetTransaction = createAction(
    `${transactionsActionsPrefix}/resetTransaction`,
    (payload: { account: Account }) => ({ payload }),
);

const replaceTransaction = createAction(
    `${transactionsActionsPrefix}/replaceTransaction`,
    (payload: { key: string; txid: string; tx: WalletAccountTransaction }) => ({ payload }),
);

const removeTransaction = createAction(
    `${transactionsActionsPrefix}/removeTransaction`,
    (payload: { account: Account; txs: { txid: string }[] }) => ({ payload }),
);

const addTransaction = createAction(
    `${transactionsActionsPrefix}/addTransaction`,
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

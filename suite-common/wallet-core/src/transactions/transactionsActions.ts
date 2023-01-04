import { createAction } from '@reduxjs/toolkit';

import { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import { AccountTransaction } from '@trezor/connect';
import { enhanceTransaction } from '@suite-common/wallet-utils';

export const modulePrefix = '@common/wallet-core/transactions';

const fetchError = createAction(
    `${modulePrefix}/fetchError`,
    (payload: { error: string | null }) => ({ payload }),
);
const fetchSuccess = createAction(`${modulePrefix}/fetchSuccess`);
const fetchInit = createAction(`${modulePrefix}/fetchInit`);

const resetTransaction = createAction(
    `${modulePrefix}/resetTransaction`,
    (payload: { account: Account }) => ({ payload }),
);

const replaceTransaction = createAction(
    `${modulePrefix}/replaceTransaction`,
    (payload: { key: string; txid: string; tx: WalletAccountTransaction }) => ({ payload }),
);

const removeTransaction = createAction(
    `${modulePrefix}/removeTransaction`,
    (payload: { account: Account; txs: { txid: string }[] }) => ({ payload }),
);

const addTransaction = createAction(
    `${modulePrefix}/addTransaction`,
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
} as const;

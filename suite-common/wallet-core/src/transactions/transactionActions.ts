import { createAction } from '@reduxjs/toolkit';

import { Account, WalletAccountTransaction } from '@suite-common/wallet-types/libDev/src';
import { AccountTransaction } from '@trezor/connect';
import { enhanceTransaction } from '@suite-common/wallet-utils/libDev/src';

import { modulePrefix } from './transactionConstants';

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
    (payload: { account: Account; txs: WalletAccountTransaction[] }) => ({ payload }),
);

const addTransaction = createAction(
    `${modulePrefix}/addTransaction`,
    ({
        transactions,
        account,
        page,
    }: {
        transactions: AccountTransaction[];
        account: Account;
        page?: number;
    }): {
        payload: { transactions: WalletAccountTransaction[]; account: Account; page?: number };
    } => ({
        payload: {
            transactions: transactions.map(t => enhanceTransaction(t, account)),
            account,
            page,
        },
    }),
);

export const transactionActions = {
    addTransaction,
    fetchError,
    fetchInit,
    fetchSuccess,
    replaceTransaction,
    removeTransaction,
    resetTransaction,
} as const;

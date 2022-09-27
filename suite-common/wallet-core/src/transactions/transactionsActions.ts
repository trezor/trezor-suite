import { createAction } from '@reduxjs/toolkit';

import { AccountKey } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { AccountTransaction } from '@trezor/connect';

export const modulePrefix = '@common/wallet-core/transactions';

const resetTransaction = createAction(
    `${modulePrefix}/resetTransaction`,
    (payload: { account: Account }) => ({ payload }),
);

const replaceTransaction = createAction(
    `${modulePrefix}/replaceTransaction`,
    (payload: { key: string; txid: string; tx: AccountTransaction }) => ({ payload }),
);

const removeTransaction = createAction(
    `${modulePrefix}/removeTransaction`,
    (payload: { account: Account; txs: { txid: string }[] }) => ({ payload }),
);

const addTransaction = createAction(
    `${modulePrefix}/addTransaction`,
    ({
        transactions,
        accountKey,
        networkSymbol,
        page,
        perPage,
    }: {
        transactions: AccountTransaction[];
        accountKey: AccountKey;
        networkSymbol: NetworkSymbol;
        page?: number;
        perPage?: number;
    }): {
        payload: {
            transactions: AccountTransaction[];
            accountKey: AccountKey;
            networkSymbol: NetworkSymbol;
            page?: number;
            perPage?: number;
        };
    } => ({
        payload: {
            transactions,
            accountKey,
            networkSymbol,
            page,
            perPage,
        },
    }),
);

export const transactionsActions = {
    addTransaction,
    replaceTransaction,
    removeTransaction,
    resetTransaction,
} as const;

import { createAction } from '@reduxjs/toolkit';

import { type events } from '@suite-common/analytics';
import {
    type Account,
    type AccountKey,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import { type AccountTransaction } from '@trezor/connect';

export const TRANSACTIONS_MODULE_PREFIX = '@common/wallet-core/transactions';

type TransactionBroadcastStatusPayload = {
    account: Account;
    flow: events.TransactionBroadcastStatusFlow;
    isCancellation?: boolean;
    isRbf?: boolean;
} & ({ status: 'success'; txid: string } | { status: 'error' });

const transactionBroadcastStatus = createAction<TransactionBroadcastStatusPayload>(
    `${TRANSACTIONS_MODULE_PREFIX}/transactionBroadcastStatus`,
);

const resetTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/resetTransaction`,
    (payload: { account: Account }) => ({ payload }),
);

const replaceTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/replaceTransaction`,
    (payload: { key: AccountKey; txid: string; tx: WalletAccountTransaction }) => ({ payload }),
);

const removeTransaction = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/removeTransaction`,
    (payload: { account: Account; txs: { txid: string }[] }) => ({ payload }),
);

const markTransactionAsNotScam = createAction(
    `${TRANSACTIONS_MODULE_PREFIX}/markTransactionAsNotScam`,
    (payload: { key: AccountKey; txid: string; isMarkedAsNotScam: boolean }) => ({ payload }),
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

export const transactionsActions = {
    transactionBroadcastStatus,
    addTransaction,
    replaceTransaction,
    removeTransaction,
    resetTransaction,
    markTransactionAsNotScam,
} as const;

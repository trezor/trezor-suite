import { shallowEqual } from 'react-redux';

import { getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    isPending,
    isTrezorConnectBackendType,
    sortByBlockHeight,
} from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';
import { type TransactionsRootState } from '../transactionsReducerTypes';
import {
    selectAccountTransactionsFetchStatus,
    selectAccountTransactionsWithNulls,
} from '../transactionsSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    TransactionsRootState & AccountsRootState
>();

type AccountTransfers = {
    transfers: WalletAccountTransaction[];
    oldestKnownBlockHeight: number | undefined;
    isComplete: boolean;
};

export const sortByBlockHeightThenTime = (
    a: Pick<WalletAccountTransaction, 'blockHeight' | 'blockTime'>,
    b: Pick<WalletAccountTransaction, 'blockHeight' | 'blockTime'>,
) => sortByBlockHeight(a, b) || (b.blockTime ?? 0) - (a.blockTime ?? 0);

export type AccountsTransactions = {
    transactions: WalletAccountTransaction[];
    confirmedCount: number;
    isComplete: boolean;
};

const COMPLETE_EMPTY_ACCOUNT: AccountTransfers = {
    transfers: [],
    oldestKnownBlockHeight: undefined,
    isComplete: true,
};

const isTransferOf = (transaction: WalletAccountTransaction, contractAddress: TokenAddress) => {
    const isEvm = getNetworkType(transaction.symbol) === 'ethereum';

    return transaction.tokens.some(token =>
        isEvm
            ? token.contract.toLowerCase() === contractAddress.toLowerCase()
            : token.contract === contractAddress,
    );
};

const selectAccountTransfers = createMemoizedSelector(
    [
        (state, accountKey: AccountKey, _contractAddress?: TokenAddress) => {
            const account = selectAccountByKey(state, accountKey);

            return account === null ? null : isTrezorConnectBackendType(account.backendType);
        },
        selectAccountTransactionsWithNulls,
        selectAccountTransactionsFetchStatus,
        (_state, _accountKey: AccountKey, contractAddress?: TokenAddress) => contractAddress,
    ],
    (isConnectAccount, stored, fetchStatus, contractAddress): AccountTransfers => {
        // A removed account has nothing left to load, so it must not keep the list loading.
        if (isConnectAccount === null) return COMPLETE_EMPTY_ACCOUNT;

        const isComplete = !isConnectAccount || !!fetchStatus?.areAllTransactionsLoaded;
        const firstGap = stored.findIndex(transaction => !transaction);
        const fetchedPages = fetchStatus?.fetchedPages;
        const knownLength = isComplete
            ? stored.length
            : Math.max(
                  firstGap === -1 ? stored.length : firstGap,
                  (fetchedPages?.count ?? 0) * (fetchedPages?.perPage ?? 0),
              );
        const transactions = stored.filter(isNotNullOrUndefined);

        return {
            transfers: contractAddress
                ? transactions.filter(transaction => isTransferOf(transaction, contractAddress))
                : transactions,
            oldestKnownBlockHeight: stored
                .slice(0, knownLength)
                .filter(isNotNullOrUndefined)
                .filter(transaction => !isPending(transaction))
                .at(-1)?.blockHeight,
            isComplete,
        };
    },
);

// The whole state is an input, so this reruns on every store update. That stays cheap: each
// account's transfers are memoized on their own, and the shallow check keeps the result stable.
const selectAccountsTransfers = createMemoizedSelector(
    [
        (state: TransactionsRootState & AccountsRootState) => state,
        (_state, accountKeys: readonly AccountKey[], _contractAddress?: TokenAddress) =>
            accountKeys,
        (_state, _accountKeys: readonly AccountKey[], contractAddress?: TokenAddress) =>
            contractAddress,
    ],
    (state, accountKeys, contractAddress) =>
        accountKeys.map(accountKey => selectAccountTransfers(state, accountKey, contractAddress)),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectAccountsTransactions = createMemoizedSelector(
    [selectAccountsTransfers],
    (accounts): AccountsTransactions => {
        const loading = accounts.filter(account => !account.isComplete);
        const frontier = Math.max(
            -Infinity,
            ...loading.map(account => account.oldestKnownBlockHeight ?? Infinity),
        );
        const transactions = accounts
            .flatMap(account => account.transfers)
            .filter(
                transaction => isPending(transaction) || (transaction.blockHeight ?? 0) > frontier,
            )
            .sort(sortByBlockHeightThenTime);

        return {
            transactions: returnStableArrayIfEmpty(transactions),
            confirmedCount: transactions.filter(transaction => !isPending(transaction)).length,
            isComplete: loading.length === 0,
        };
    },
);

type IsAccountsTransactionsPageReadyParams = {
    accountsTransactions: AccountsTransactions;
    page: number;
    perPage: number;
};

export const isAccountsTransactionsPageReady = ({
    accountsTransactions,
    page,
    perPage,
}: IsAccountsTransactionsPageReadyParams) =>
    accountsTransactions.isComplete || accountsTransactions.confirmedCount >= page * perPage;

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    TokenDefinitionsRootState,
    getIsPhishingTransaction,
} from '@suite-common/token-definitions';
import { selectNetworkTokenDefinitions } from '@suite-common/token-definitions/src/tokenDefinitionsSelectors';
import { Account, AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    getConfirmations,
    isClaimTx,
    isPending,
    isStakeTx,
    isStakeTypeTx,
    isUnstakeTx,
} from '@suite-common/wallet-utils';

import { TransactionsRootState } from './transactionsReducer';
import { AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import {
    BlockchainRootState,
    selectBlockchainHeightBySymbol,
} from '../blockchain/blockchainReducer';
import { isAccountStakingActive } from '../stake/stakeUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    TransactionsRootState & AccountsRootState
>();

export const selectIsLoadingAccountTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) => state.wallet.transactions.fetchStatusDetail?.[accountKey ?? '']?.status === 'loading';

export const selectTransactions = (state: TransactionsRootState) =>
    state.wallet.transactions.transactions;

export const selectAreAllTransactionsLoaded = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) => state.wallet.transactions.fetchStatusDetail?.[accountKey ?? '']?.areAllTransactionsLoaded;

const EMPTY_STABLE_TRANSACTIONS: WalletAccountTransaction[] = [];
/**
 * The list is not sorted here because it may contain null values as placeholders
 * for transactions that have not been fetched yet. (This affects pagination.)
 * !!! Use this selector only if you explicitly needs that null placeholder values !!!
 */
export const selectAccountTransactionsWithNulls = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) => state.wallet.transactions.transactions[accountKey ?? ''] ?? EMPTY_STABLE_TRANSACTIONS;

export const selectAccountTransactions = createMemoizedSelector(
    [selectAccountTransactionsWithNulls],
    transactions => returnStableArrayIfEmpty(transactions.filter(t => !!t)),
);

export const selectPendingAccountAddresses = createMemoizedSelector(
    [selectAccountTransactions],
    transactions => {
        const pendingAddresses: string[] = [];
        const pendingTxs = transactions.filter(isPending);
        pendingTxs.forEach(t =>
            t.targets.forEach(target =>
                target.addresses?.forEach(a => pendingAddresses.unshift(a)),
            ),
        );

        return returnStableArrayIfEmpty(pendingAddresses);
    },
);

export const selectAllPendingTransactions = createMemoizedSelector(
    [selectTransactions],
    transactions =>
        Object.keys(transactions).reduce(
            (response, accountKey) => {
                response[accountKey] = (transactions[accountKey] ?? []).filter(isPending);

                return response;
            },
            {} as typeof transactions,
        ),
);

export const selectTransactionByAccountKeyAndTxid = createMemoizedSelector(
    [selectAccountTransactions, (_state, _accountKey: AccountKey | null, txid: string) => txid],
    (transactions, txid) => {
        const transaction = transactions.find(tx => tx?.txid === txid);

        return transaction ?? null;
    },
);

export const selectTransactionBlockTimeById = createMemoizedSelector(
    [selectTransactionByAccountKeyAndTxid],
    transaction => (transaction?.blockTime ? transaction.blockTime * 1000 : null),
);

export const selectTransactionTargets = createMemoizedSelector(
    [selectTransactionByAccountKeyAndTxid],
    transaction => transaction?.targets,
);

export const selectTransactionFirstTargetAddress = createMemoizedSelector(
    [selectTransactionTargets],
    targets => targets?.[0]?.addresses?.[0],
);

export const selectIsTransactionPending = createMemoizedSelector(
    [selectTransactionByAccountKeyAndTxid],
    transaction => (transaction ? isPending(transaction) : false),
);

export const selectTransactionConfirmations = (
    state: TransactionsRootState & BlockchainRootState & AccountsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByAccountKeyAndTxid(state, accountKey, txid);
    if (!transaction) return 0;

    const blockchainHeight = selectBlockchainHeightBySymbol(state, transaction.symbol);

    return getConfirmations(transaction, blockchainHeight);
};

export const selectIsPhishingTransaction = (
    state: TokenDefinitionsRootState & TransactionsRootState & AccountsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByAccountKeyAndTxid(state, accountKey, txid);

    if (!transaction) return false;

    const tokenDefinitions = selectNetworkTokenDefinitions(state, transaction.symbol);

    if (!tokenDefinitions) return false;

    return getIsPhishingTransaction(transaction, tokenDefinitions);
};

export const selectAccountStakeTypeTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(
                tx =>
                    isStakeTypeTx(tx?.ethereumSpecific?.parsedData?.methodId) ||
                    !!tx?.solanaSpecific?.stakeOperation?.type,
            ),
        ),
);

export const selectAccountStakeTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => isStakeTx(tx?.ethereumSpecific?.parsedData?.methodId)),
        ),
);

export const selectAccountUnstakeTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => isUnstakeTx(tx?.ethereumSpecific?.parsedData?.methodId)),
        ),
);

export const selectAccountClaimTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => isClaimTx(tx?.ethereumSpecific?.parsedData?.methodId)),
        ),
);

export const selectAccountIsStakingActive = createMemoizedSelector(
    [selectAccountClaimTransactions, selectAccountByKey],
    (claimTransactions, account) => isAccountStakingActive(account, claimTransactions),
);

export const selectAnyAccountIsStakingActive = createMemoizedSelector(
    [selectTransactions, (_: TransactionsRootState, accounts: Account[]) => accounts],
    (transactions, accounts) =>
        accounts.some(account => {
            const accountTransactions = transactions[account.key] ?? [];
            const claimTransactions = accountTransactions.filter(tx =>
                isClaimTx(tx?.ethereumSpecific?.parsedData?.methodId),
            );

            return isAccountStakingActive(account, claimTransactions);
        }),
);

export const selectAccountTransactionsFetchStatus = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => state.wallet.transactions.fetchStatusDetail?.[accountKey];

export const selectAccountTotalTransactions = createMemoizedSelector(
    [selectAccountByKey],
    account => account?.history.total ?? 0,
);

export const selectAreAllAccountTransactionsLoaded = createMemoizedSelector(
    [
        selectAccountTransactions,
        selectAccountTotalTransactions,
        selectAccountTransactionsFetchStatus,
    ],
    (transactions, accountTotalTransactions, fetchStatusDetail) => {
        const areAllTransactionsLoaded = !!fetchStatusDetail?.areAllTransactionsLoaded;
        if (areAllTransactionsLoaded) return true;

        return transactions.length >= accountTotalTransactions;
    },
);

export const selectIsPageAlreadyFetched = createMemoizedSelector(
    [
        selectAccountTransactionsWithNulls,
        (_state, _accountKey: AccountKey, page: number) => page,
        (_state, _accountKey: AccountKey, _page: number, perPage: number) => perPage,
    ],
    (transactions, page, perPage) => {
        const startIndex = (page - 1) * perPage;
        const stopIndex = startIndex + perPage;
        const txsForPage = transactions.slice(startIndex, stopIndex).filter(tx => !!tx?.txid);

        return txsForPage.length === perPage;
    },
);

export const selectAreAllAccountTransactionsLoadedFromNowUntilTimestamp = createMemoizedSelector(
    [
        selectAreAllAccountTransactionsLoaded,
        selectAccountTransactions,
        (_state, _accountKey: AccountKey, timestamp: number) => timestamp,
    ],
    (areAllTransactionsLoaded, transactions, timestamp) => {
        if (areAllTransactionsLoaded) return true;
        const lastTransaction = transactions[transactions.length - 1];

        return lastTransaction?.blockTime && lastTransaction.blockTime < timestamp;
    },
);

export const selectAccountTransactionsFromNowUntilTimestamp = createMemoizedSelector(
    [selectAccountTransactions, (_state, _accountKey: AccountKey, timestamp: number) => timestamp],
    (transactions, timestamp) =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => tx.blockTime && tx.blockTime >= timestamp),
        ),
);

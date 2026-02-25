import { A, D, pipe } from '@mobily/ts-belt';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    TokenDefinitionsRootState,
    isPhishingTransaction,
    selectNetworkTokenDefinitions,
} from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    Account,
    AccountKey,
    Timestamp,
    TokenAddress,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    getConfirmations,
    getFiatRateKey,
    isCardanoStakingTx,
    isClaimTx,
    isNftTokenTransfer,
    isPending,
    isStakeTx,
    isStakeTypeTx,
    isUnstakeTx,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';
import { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { typedObjectKeys } from '@trezor/utils';

import { TransactionsRootState } from './transactionsReducer';
import { AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import {
    BlockchainRootState,
    selectBlockchainHeightBySymbol,
} from '../blockchain/blockchainReducer';
import { selectHistoricFiatRates } from '../fiat-rates/fiatRatesSelectors';
import { FiatRatesRootState } from '../fiat-rates/fiatRatesTypes';
import { isAccountStakingActive } from '../stake/stakeUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    TransactionsRootState & AccountsRootState
>();

export const selectIsLoadingAccountTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) =>
    accountKey !== null &&
    state.wallet.transactions.fetchStatusDetail?.[accountKey]?.status === 'loading';

export const selectTransactions = (state: TransactionsRootState) =>
    state.wallet.transactions.transactions;

export const selectAreAllTransactionsLoaded = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) =>
    accountKey !== null &&
    state.wallet.transactions.fetchStatusDetail?.[accountKey]?.areAllTransactionsLoaded;

const EMPTY_STABLE_TRANSACTIONS: WalletAccountTransaction[] = [];
/**
 * The list is not sorted here because it may contain null values as placeholders
 * for transactions that have not been fetched yet. (This affects pagination.)
 * !!! Use this selector only if you explicitly needs that null placeholder values !!!
 */
export const selectAccountTransactionsWithNulls = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) =>
    accountKey !== null && state.wallet.transactions.transactions[accountKey]
        ? state.wallet.transactions.transactions[accountKey]
        : EMPTY_STABLE_TRANSACTIONS;

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
        typedObjectKeys(transactions).reduce(
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

export const selectTransactionIsMarkedAsNotScam = (
    state: TransactionsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByAccountKeyAndTxid(state, accountKey, txid);
    if (!transaction) return false;

    return state.wallet.transactions.phishing[accountKey]?.includes(txid);
};

export const selectAccountTransactionsMarkedAsNotScam = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => state.wallet.transactions.phishing[accountKey] ?? [];

export const selectPhishingTransactionsContext = (
    state: TokenDefinitionsRootState & TransactionsRootState & FiatRatesRootState,
    accountKey: AccountKey,
    symbol: NetworkSymbol,
) => {
    const historicRates = selectHistoricFiatRates(state);
    const tokenDefinitions = selectNetworkTokenDefinitions(state, symbol);
    const txsMarkedAsNotScam = selectAccountTransactionsMarkedAsNotScam(state, accountKey);

    return { tokenDefinitions, txsMarkedAsNotScam, historicRates };
};

export const selectIsPhishingTransaction = (
    state: TokenDefinitionsRootState &
        TransactionsRootState &
        AccountsRootState &
        FiatRatesRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByAccountKeyAndTxid(state, accountKey, txid);
    if (!transaction) return false;

    const { tokenDefinitions, txsMarkedAsNotScam, historicRates } =
        selectPhishingTransactionsContext(state, accountKey, transaction.symbol);

    return isPhishingTransaction({
        transaction,
        tokenDefinitions,
        historicRates,
        txsMarkedAsNotScam,
    });
};

export const selectAccountStakeTypeTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(
                tx =>
                    isStakeTypeTx(tx?.ethereumSpecific?.parsedData?.methodId) ||
                    !!tx?.solanaSpecific?.stakeOperation?.type ||
                    isCardanoStakingTx(tx),
            ),
        ),
);

export const selectAccountPendingStakeTypeTransactions = createMemoizedSelector(
    [selectAccountStakeTypeTransactions],
    transactions => transactions.filter(tx => isPending(tx)),
);

export const hasPendingStakeTypeTransaction = createMemoizedSelector(
    [selectAccountStakeTypeTransactions],
    transactions => transactions.some(tx => isPending(tx)),
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

export const selectAreAllAccountTransactionsLoaded: (
    state: TransactionsRootState & AccountsRootState,
    accountKey: AccountKey,
) => boolean = createMemoizedSelector(
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

export const selectTransactionsWithMissingRates = (
    state: FiatRatesRootState & TransactionsRootState & AccountsRootState,
    localCurrency: BaseCurrencyCode,
    accountKey?: AccountKey,
) => {
    const transactions = selectTransactions(state);
    const historicFiatRates = selectHistoricFiatRates(state);

    return pipe(
        accountKey ? { [accountKey]: transactions[accountKey] } : transactions,
        D.mapWithKey((key, txs) => ({
            account: selectAccountByKey(state, key as AccountKey),
            txs: txs.filter(tx => {
                const fiatRateKey = getFiatRateKey(tx.symbol, localCurrency as BaseCurrencyCode);
                const roundedTimestamp = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
                const historicRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp];

                const isMissingTokenRate = tx.tokens
                    .filter(token => !isNftTokenTransfer(token))
                    .some(token => {
                        const tokenFiatRateKey = getFiatRateKey(
                            tx.symbol,
                            localCurrency,
                            token.contract as TokenAddress,
                        );
                        const historicTokenRate =
                            historicFiatRates?.[tokenFiatRateKey]?.[roundedTimestamp];

                        return historicTokenRate === undefined || historicTokenRate === 0;
                    });

                return historicRate === undefined || historicRate === 0 || isMissingTokenRate;
            }),
        })),
        D.filter(({ account, txs }) => !!account && !!txs.length),
        D.values,
        A.filter(value => !!value),
    ) as {
        account: Account;
        txs: WalletAccountTransaction[];
    }[];
};

import { useCallback, useMemo } from 'react';

import { selectIsQueryChainDataEnabled } from '@suite/flags';
import {
    useChainAccountTransactions,
    useChainHistoricRates,
    useSelectedChainNetworks,
} from '@suite-common/chain-data';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    fetchAllTransactionsForAccountThunk,
    fetchTransactionsPageThunk,
    selectAccountTransactions,
    selectAccountTransactionsWithNulls,
    selectActiveDustPhishingThreshold,
    selectAreAllTransactionsLoaded,
    selectBaseCurrency,
    selectHistoricFiatRates,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';
import type {
    Account,
    RatesByTimestamps,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode, Transaction } from '@trezor/blockchain-link-types';

import { useSelector } from 'src/hooks/suite';

import { useLegacyPortfolioAccounts } from './useLegacyPortfolioAccounts';

export type FetchPageOptions = { noLoading?: boolean };

/** One account's history as the transaction views read it, wherever it comes from. */
export type AccountTransactionsSource = {
    /** The history is read through chain networks rather than the wallet store. */
    isQueryOwned: boolean;

    /** Newest first; the store's list keeps holes for pages not loaded yet. */
    transactions: WalletAccountTransaction[];

    /** Transactions in the history (confirmed), as far as the backend knows. */
    total: number;
    isLoading: boolean;
    areAllLoaded: boolean;
    historicRates: RatesByTimestamps;
    fetchPage: (page: number, perPage: number, options?: FetchPageOptions) => Promise<unknown>;
    fetchAll: () => Promise<unknown>;
};

/** The history the wallet store holds, loaded by its thunks. */
export const useStoreTransactionsSource = (account: Account): AccountTransactionsSource => {
    const { dispatch } = useServices(injectDispatch);
    const transactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, account.key),
    );
    const isLoading = useSelector(state => selectIsLoadingAccountTransactions(state, account.key));
    const areAllLoaded = useSelector(state =>
        Boolean(selectAreAllTransactionsLoaded(state, account.key)),
    );
    const historicRates = useSelector(selectHistoricFiatRates);

    const fetchPage = useCallback(
        (page: number, perPage: number, options: FetchPageOptions = {}) =>
            dispatch(
                fetchTransactionsPageThunk({
                    accountKey: account.key,
                    page,
                    perPage,
                    noLoading: Boolean(options.noLoading),
                }),
            ),
        [dispatch, account.key],
    );
    const fetchAll = useCallback(
        () => dispatch(fetchAllTransactionsForAccountThunk({ accountKey: account.key })),
        [dispatch, account.key],
    );

    return {
        isQueryOwned: false,
        // The store keeps holes for unloaded pages; views slice it by page before filtering.
        transactions,
        total: account.history.total,
        isLoading,
        areAllLoaded,
        historicRates,
        fetchPage,
        fetchAll,
    };
};

/** Currencies past rates are read in: the base currency, and USD while the dust check is on. */
export const useHistoricRateCurrencies = (): readonly BaseCurrencyCode[] => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const dustThreshold = useSelector(selectActiveDustPhishingThreshold);

    return useMemo(
        () =>
            dustThreshold !== undefined && baseCurrency !== 'usd'
                ? [baseCurrency, 'usd']
                : [baseCurrency],
        [baseCurrency, dustThreshold],
    );
};

/** Whether the account's history is read through chain networks rather than the store. */
export const useIsHistoryQueryOwned = (account: Account | undefined) => {
    const isQueryChainDataEnabled = useSelector(selectIsQueryChainDataEnabled);
    const networks = useSelectedChainNetworks();

    return (
        isQueryChainDataEnabled &&
        account !== undefined &&
        account.backendType !== 'coinjoin' &&
        networks.some(
            network => network.symbol === account.symbol && network.getTransactions !== undefined,
        )
    );
};

/** Wallet transactions from the backend's, read against the account like the store does. */
export const enhanceChainTransactions = (
    transactions: readonly Transaction[],
    account: Account,
    addresses: Account['addresses'],
) => {
    // Bitcoin transactions are read against the addresses the backend answered with.
    const enhancingAccount = { ...account, addresses: addresses ?? account.addresses };

    return transactions.map(transaction => enhanceTransaction(transaction, enhancingAccount));
};

const useQueryTransactionsSource = (
    account: Account,
    enabled: boolean,
): AccountTransactionsSource => {
    const networks = useSelectedChainNetworks();
    const currencies = useHistoricRateCurrencies();
    const storedTransactions = useSelector(state => selectAccountTransactions(state, account.key));

    const legacyAccounts = useMemo(() => [account], [account]);
    const { accounts } = useLegacyPortfolioAccounts(legacyAccounts);
    const ref = accounts[0]?.chainAccounts[0] ?? null;
    const network = networks.find(({ symbol }) => symbol === ref?.symbol);
    const isEnabled = enabled && !!network?.getTransactions;

    const history = useChainAccountTransactions({ network, ref, enabled: isEnabled });

    const historicRates = useChainHistoricRates({
        network,
        pages: history.pages,
        currencies,
        enabled: isEnabled,
    });

    const transactions = useMemo(() => {
        const fetched = enhanceChainTransactions(
            history.transactions,
            account,
            history.pages[0]?.addresses,
        );
        const fetchedTxids = new Set(fetched.map(({ txid }) => txid));

        // Transactions the wallet just sent, until the backend lists them.
        const localPending = storedTransactions.filter(
            transaction =>
                transaction.deadline !== undefined && !fetchedTxids.has(transaction.txid),
        );

        return [...localPending, ...fetched];
    }, [account, history.pages, history.transactions, storedTransactions]);

    const { loadUntil } = history;
    const fetchPage = useCallback(
        (page: number, perPage: number) => loadUntil(page * perPage),
        [loadUntil],
    );
    const fetchAll = useCallback(() => loadUntil('all'), [loadUntil]);

    return {
        isQueryOwned: true,
        transactions,
        total: history.total ?? history.transactions.length,
        isLoading: history.isFetching,
        areAllLoaded: !history.isPending && !history.hasNextPage,
        historicRates,
        fetchPage,
        fetchAll,
    };
};

/**
 * The account's history for the transaction views. With the `queryChainData` flag on and the
 * account's network keeping history, it is read through chain networks; otherwise from the store.
 */
export const useAccountTransactionsSource = (account: Account): AccountTransactionsSource => {
    const isQueryOwned = useIsHistoryQueryOwned(account);

    const storeSource = useStoreTransactionsSource(account);
    const querySource = useQueryTransactionsSource(account, isQueryOwned);

    return isQueryOwned ? querySource : storeSource;
};

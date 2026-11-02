import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    type Account,
    type AccountKey,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { isTrezorConnectBackendType } from '@suite-common/wallet-utils';
import { type AccountInfo } from '@trezor/connect';
import { type Getter } from '@trezor/dependency-injection';

import { type TransactionsState } from '../transactionsReducerTypes';
import {
    type AccountsTransactions,
    isAccountsTransactionsPageReady,
} from './accountsTransactionsSelectors';
import {
    type FetchAllTransactionsForAccountThunkParams,
    type FetchTransactionsPageThunkParams,
} from '../transactionsThunks';

/** `fetchTransactionsPageThunk`, dispatched and unwrapped. */
export type FetchTransactionsPage = (
    params: FetchTransactionsPageThunkParams,
) => Promise<AccountInfo | 'ALREADY_FETCHED'>;

/** `fetchAllTransactionsForAccountThunk`, dispatched and unwrapped. */
export type FetchAllTransactionsForAccount = (
    params: FetchAllTransactionsForAccountThunkParams,
) => Promise<WalletAccountTransaction[]>;

export type TransactionRetrieverDeps = {
    fetchTransactionsPage: FetchTransactionsPage;
    fetchAllTransactionsForAccount: FetchAllTransactionsForAccount;
    getAccount: Getter<[accountKey: AccountKey], Account | null>;
    getTransactionsFetchStatus: Getter<
        [accountKey: AccountKey],
        TransactionsState['fetchStatusDetail'][AccountKey] | undefined
    >;
    getAccountsTransactions: Getter<
        [accountKeys: readonly AccountKey[], contractAddress?: TokenAddress],
        AccountsTransactions
    >;
};

export type RetrieveTransactionsParams = {
    accountKeys: readonly AccountKey[];
    contractAddress?: TokenAddress;
    signal?: AbortSignal;
};

export type RetrieveTransactionsPageParams = RetrieveTransactionsParams & {
    page: number;
    perPage: number;
};

/** Each resolves once the store holds what was asked for, and rejects when a fetch fails. */
export type TransactionRetriever = {
    retrievePage: (params: RetrieveTransactionsPageParams) => Promise<void>;
    retrieveAll: (params: RetrieveTransactionsParams) => Promise<void>;
};

export type TransactionRetrieverDep = {
    transactionRetriever: TransactionRetriever;
};

export const createTransactionRetriever = (
    deps: TransactionRetrieverDeps,
): TransactionRetriever => {
    const getAccountKeysToFetch = (accountKeys: readonly AccountKey[]) =>
        accountKeys.filter(accountKey => {
            const account = deps.getAccount(accountKey);

            return (
                !!account &&
                isTrezorConnectBackendType(account.backendType) &&
                !deps.getTransactionsFetchStatus(accountKey)?.areAllTransactionsLoaded
            );
        });

    const pageFetches = new Map<AccountKey, Promise<unknown>>();

    const fetchNextPage = (accountKey: AccountKey) => {
        const running = pageFetches.get(accountKey);
        if (running) return running;

        const account = deps.getAccount(accountKey);
        if (!account) return Promise.resolve();

        const perPage = getTxsPerPage(account.networkType);
        const fetchedPages = deps.getTransactionsFetchStatus(accountKey)?.fetchedPages;
        const page = fetchedPages?.perPage === perPage ? fetchedPages.count + 1 : 1;
        const fetching = deps
            .fetchTransactionsPage({ accountKey, page, perPage, noLoading: true })
            .finally(() => pageFetches.delete(accountKey));

        pageFetches.set(accountKey, fetching);

        return fetching;
    };

    const retrievePage: TransactionRetriever['retrievePage'] = async params => {
        const isPageReady = () =>
            isAccountsTransactionsPageReady({
                accountsTransactions: deps.getAccountsTransactions(
                    params.accountKeys,
                    params.contractAddress,
                ),
                page: params.page,
                perPage: params.perPage,
            });

        while (!isPageReady()) {
            if (params.signal?.aborted) {
                throw params.signal.reason;
            }
            await Promise.all(getAccountKeysToFetch(params.accountKeys).map(fetchNextPage));
        }
    };

    // The walk is not aborted when the caller leaves: the thunk runs one instance per account, so
    // an abort would also cancel it for whoever else is waiting on it, such as the search box.
    const retrieveAll: TransactionRetriever['retrieveAll'] = async ({ accountKeys }) => {
        await Promise.all(
            getAccountKeysToFetch(accountKeys).map(accountKey =>
                deps.fetchAllTransactionsForAccount({ accountKey, noLoading: true }),
            ),
        );
    };

    return { retrievePage, retrieveAll };
};

export const injectTransactionRetriever = (
    services: TransactionRetrieverDep,
): TransactionRetrieverDep => ({
    transactionRetriever: services.transactionRetriever,
});

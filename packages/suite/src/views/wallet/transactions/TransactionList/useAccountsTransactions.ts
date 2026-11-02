import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import {
    injectTransactionRetriever,
    isAccountsTransactionsPageReady,
    selectAccountsTransactions,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';

import { useSelector } from 'src/hooks/suite';

type UseAccountsTransactionsParams = {
    accountKeys: readonly AccountKey[];
    contractAddress?: TokenAddress;
    page: number;
    perPage: number;
    isAllRequested: boolean;
    /** Called once a load has failed for good, after its retry. */
    onError?: (error: Error) => void;
};

const RETRY_COUNT = 1;

const QUERY_OPTIONS = { refetchOnWindowFocus: false } as const;

// TanStack Query v5 has no error callback on a query, and its `retry` decides once per failure
// whether to try again, so the last of those decisions is where a load has failed for good.
const retryOrReport =
    (onError: UseAccountsTransactionsParams['onError']) => (failureCount: number, error: Error) => {
        if (failureCount < RETRY_COUNT) return true;

        onError?.(error);

        return false;
    };

export const useAccountsTransactions = ({
    accountKeys,
    contractAddress,
    page,
    perPage,
    isAllRequested,
    onError,
}: UseAccountsTransactionsParams) => {
    const { transactionRetriever } = useServices(injectTransactionRetriever);
    const accountsTransactions = useSelector(state =>
        selectAccountsTransactions(state, accountKeys, contractAddress),
    );
    const isPageReady = isAccountsTransactionsPageReady({ accountsTransactions, page, perPage });

    const pageQuery = useQuery({
        ...QUERY_OPTIONS,
        retry: retryOrReport(onError),
        queryKey: commonQueryKeys.transactionsPage({
            accountKeys,
            contractAddress,
            page,
            perPage,
        }),
        queryFn: async ({ signal }) => {
            await transactionRetriever.retrievePage({
                accountKeys,
                contractAddress,
                page,
                perPage,
                signal,
            });

            // useQuery takes no undefined data; the transactions themselves are in the store.
            return null;
        },
        enabled: !isAllRequested && !isPageReady,
    });
    const allQuery = useQuery({
        ...QUERY_OPTIONS,
        retry: retryOrReport(onError),
        queryKey: commonQueryKeys.allTransactions(accountKeys),
        queryFn: async ({ signal }) => {
            await transactionRetriever.retrieveAll({ accountKeys, signal });

            return null;
        },
        enabled: isAllRequested && !accountsTransactions.isComplete,
    });

    const activeQuery = isAllRequested ? allQuery : pageQuery;
    const isFailed = activeQuery.error !== null;

    return {
        ...accountsTransactions,
        isLoading: !isPageReady && !isFailed,
        isFailed,
        retry: () => activeQuery.refetch(),
    };
};

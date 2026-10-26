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
    isWaitingForAll: boolean;
};

const QUERY_OPTIONS = { retry: 1, refetchOnWindowFocus: false } as const;

export const useAccountsTransactions = ({
    accountKeys,
    contractAddress,
    page,
    perPage,
    isAllRequested,
    isWaitingForAll,
}: UseAccountsTransactionsParams) => {
    const { transactionRetriever } = useServices(injectTransactionRetriever);
    const accountsTransactions = useSelector(state =>
        selectAccountsTransactions(state, accountKeys, contractAddress),
    );
    const isPageReady = isAccountsTransactionsPageReady(accountsTransactions, page, perPage);

    const pageQuery = useQuery({
        ...QUERY_OPTIONS,
        queryKey: commonQueryKeys.transactionsPage(accountKeys, contractAddress, page, perPage),
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
        queryKey: commonQueryKeys.allTransactions(accountKeys),
        queryFn: async ({ signal }) => {
            await transactionRetriever.retrieveAll({ accountKeys, signal });

            return null;
        },
        enabled: isAllRequested && !accountsTransactions.isComplete,
    });

    const error = isAllRequested ? allQuery.error : pageQuery.error;
    const isReady = isWaitingForAll ? accountsTransactions.isComplete : isPageReady;

    return { ...accountsTransactions, isLoading: !isReady && !error, error };
};

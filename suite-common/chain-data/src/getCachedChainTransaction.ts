import { type InfiniteData, type QueryClient, chainQueryKeys } from '@suite-common/react-query';
import type { Transaction } from '@trezor/blockchain-link-types';
import type { BackendType, ChainTransactionsPage } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { findChainTransaction } from './findChainTransaction';

export type CachedChainAccount = {
    symbol: NetworkSymbol;
    backendType: BackendType;
    descriptor: string;
};

/** A transaction already loaded for the account, without loading anything. */
export const getCachedChainTransaction = (
    queryClient: QueryClient,
    account: CachedChainAccount,
    txid: string,
): Transaction | undefined => {
    const data = queryClient.getQueryData<InfiniteData<ChainTransactionsPage>>(
        chainQueryKeys.accountTransactions(account.symbol, account.backendType, account.descriptor),
    );

    return data ? findChainTransaction(data.pages, txid) : undefined;
};

import { shallowEqual } from 'react-redux';

import {
    type AssetDetailState,
    selectWalletAssetAccountKeys,
    selectWalletAssetCandidateAccountKeys,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectAccountTotalTransactions,
    selectAccountTransactionsWithNulls,
    selectAreAllAccountTransactionsLoaded,
    selectIsPageAlreadyFetched,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { getHistoryCoveredSince, getOlderHistoryFrom } from '@suite-common/wallet-utils';
import {
    type TokensRootState,
    type WalletAccountTransaction,
    selectAccountTransactionsWithTokenTransfers,
} from '@suite-native/tokens';

export type AccountHistory = {
    accountKey: AccountKey;
    isAssetAccount: boolean;
    transactions: readonly WalletAccountTransaction[];
    loadedTransactionCount: number;
    historyTotal: number;
    areAllTransactionsLoaded: boolean;
    isFirstPageCached: boolean;
    olderHistoryFrom: number | undefined;
    historyCoveredSince: number | undefined;
};

type WalletAssetAccountHistoriesParams = {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress | undefined;
    perPage: number;
};

export const selectWalletAssetAccountHistories = (
    state: AssetDetailState & TokensRootState,
    { networkSymbol, tokenContract, perPage }: WalletAssetAccountHistoriesParams,
): AccountHistory[] => {
    const assetAccountKeys = new Set(
        selectWalletAssetAccountKeys(state, networkSymbol, tokenContract),
    );

    return selectWalletAssetCandidateAccountKeys(state, networkSymbol, tokenContract).map(
        accountKey => {
            const account = selectAccountByKey(state, accountKey);

            return {
                accountKey,
                isAssetAccount: assetAccountKeys.has(accountKey),
                transactions: selectAccountTransactionsWithTokenTransfers(state, accountKey),
                loadedTransactionCount: selectAccountTransactionsWithNulls(state, accountKey)
                    .length,
                historyTotal: selectAccountTotalTransactions(state, accountKey),
                areAllTransactionsLoaded: selectAreAllAccountTransactionsLoaded(state, accountKey),
                isFirstPageCached: selectIsPageAlreadyFetched(state, accountKey, 1, perPage),
                olderHistoryFrom: account ? getOlderHistoryFrom(account) : undefined,
                historyCoveredSince: account ? getHistoryCoveredSince(account) : undefined,
            };
        },
    );
};

export const areAccountHistoriesEqual = (
    left: readonly AccountHistory[],
    right: readonly AccountHistory[],
) =>
    left.length === right.length &&
    left.every((accountHistory, index) => shallowEqual(accountHistory, right[index]));

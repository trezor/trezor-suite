import {
    type AssetDetailState,
    selectWalletAssetAccountKeys,
    selectWalletAssetCandidateAccountKeys,
} from '@suite-common/assets';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectAccountTotalTransactions,
    selectAccountTransactionsWithNulls,
    selectAreAllAccountTransactionsLoaded,
    selectIsPageAlreadyFetched,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getHistoryCoveredSince, getOlderHistoryFrom } from '@suite-common/wallet-utils';
import {
    type TokensRootState,
    type WalletAccountTransaction,
    selectAccountTransactionsWithTokenTransfers,
} from '@suite-native/tokens';
import { createWeakMapSelector } from '@trezor/redux-utils';

type AssetTransactionsState = AssetDetailState & TokensRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetTransactionsState>();

export type AccountHistory = {
    accountKey: AccountKey;
    isAssetAccount: boolean;
    transactions: readonly WalletAccountTransaction[];
    transactionSlotCount: number;
    historyTotal: number;
    areAllTransactionsLoaded: boolean;
    isFirstPageCached: boolean;
    olderHistoryFrom: number | undefined;
    historyCoveredSince: number | undefined;
};

const selectAccountHistory = createMemoizedSelector(
    [
        (_state, accountKey: AccountKey) => accountKey,
        (_state, _accountKey: AccountKey, isAssetAccount: boolean) => isAssetAccount,
        (state, accountKey: AccountKey) => selectAccountByKey(state, accountKey),
        (state, accountKey: AccountKey) =>
            selectAccountTransactionsWithTokenTransfers(state, accountKey),
        (state, accountKey: AccountKey) =>
            selectAccountTransactionsWithNulls(state, accountKey).length,
        (state, accountKey: AccountKey) => selectAccountTotalTransactions(state, accountKey),
        (state, accountKey: AccountKey) => selectAreAllAccountTransactionsLoaded(state, accountKey),
        (state, accountKey: AccountKey, _isAssetAccount: boolean, perPage: number) =>
            selectIsPageAlreadyFetched(state, accountKey, 1, perPage),
    ],
    (
        accountKey,
        isAssetAccount,
        account,
        transactions,
        transactionSlotCount,
        historyTotal,
        areAllTransactionsLoaded,
        isFirstPageCached,
    ): AccountHistory => ({
        accountKey,
        isAssetAccount,
        transactions,
        transactionSlotCount,
        historyTotal,
        areAllTransactionsLoaded,
        isFirstPageCached,
        olderHistoryFrom: account ? getOlderHistoryFrom(account) : undefined,
        historyCoveredSince: account ? getHistoryCoveredSince(account) : undefined,
    }),
);

// Not memoized itself, as it needs the whole state; the histories it returns are, so compare it shallowly.
export const selectWalletAssetAccountHistories = (
    state: AssetTransactionsState,
    networkSymbol: NetworkSymbol,
    tokenContract: TokenAddress | undefined,
    perPage: number,
): AccountHistory[] => {
    const assetAccountKeys = selectWalletAssetAccountKeys(state, networkSymbol, tokenContract);

    return selectWalletAssetCandidateAccountKeys(state, networkSymbol, tokenContract).map(
        accountKey =>
            selectAccountHistory(state, accountKey, assetAccountKeys.includes(accountKey), perPage),
    );
};

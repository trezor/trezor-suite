import { shallowEqual } from 'react-redux';

import {
    type TransactionsRootState,
    type WalletAssetKey,
    getTxStakeType,
    isAccountStakingActive,
    isSupportedStakingNetworkSymbol,
    selectAccounts,
    selectDeviceAssetAccounts,
    selectTransactions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { type HomeAssetTableState } from './homeAssetTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

export const selectWalletAssetAccounts = createMemoizedSelector(
    [
        selectDeviceAssetAccounts,
        selectAccounts,
        (_state: HomeAssetTableState, assetKey: WalletAssetKey) => assetKey,
    ],
    (assetAccounts, accounts, assetKey): readonly Account[] => {
        const accountKeys = new Set(
            assetAccounts
                .filter(assetAccount => assetAccount.assetKey === assetKey)
                .map(assetAccount => assetAccount.accountKey),
        );

        return returnStableArrayIfEmpty(accounts.filter(account => accountKeys.has(account.key)));
    },
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const createStakingMemoizedSelector = createWeakMapSelector.withTypes<
    HomeAssetTableState & TransactionsRootState
>();

const isStakingTrackedByClaims = (account: Account) =>
    isSupportedStakingNetworkSymbol(account.symbol) && account.networkType !== 'cardano';

export const selectWalletAssetUnstakedAccounts = createStakingMemoizedSelector(
    [selectWalletAssetAccounts, selectTransactions],
    (accounts, transactions): readonly Account[] =>
        returnStableArrayIfEmpty(
            accounts
                .filter(account => {
                    const claimTransactions = isStakingTrackedByClaims(account)
                        ? (transactions[account.key] ?? []).filter(
                              tx => getTxStakeType(tx) === 'claim',
                          )
                        : [];

                    return !isAccountStakingActive(account, claimTransactions);
                })
                .sort(
                    (left, right) =>
                        new BigNumber(right.formattedBalance).comparedTo(left.formattedBalance) ??
                        0,
                ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

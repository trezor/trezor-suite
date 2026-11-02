import { shallowEqual } from 'react-redux';

import {
    type TransactionsRootState,
    type WalletAssetKey,
    isAccountStakingActiveByHistory,
    selectAccounts,
    selectDeviceAssetAccounts,
    selectTransactions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { hasAccountOrTokenSpendableBalance } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import {
    type HomeAssetTableState,
    selectWalletAssetContractAddress,
} from './homeAssetTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

export const selectWalletAssetAccounts = createMemoizedSelector(
    [
        selectDeviceAssetAccounts,
        selectAccounts,
        (_state: HomeAssetTableState, assetKey: WalletAssetKey | undefined) => assetKey,
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

export const selectWalletAssetHasSpendableBalance = createMemoizedSelector(
    [selectWalletAssetAccounts, selectWalletAssetContractAddress],
    (accounts, contractAddress): boolean =>
        accounts.some(account =>
            hasAccountOrTokenSpendableBalance({ account, tokenContract: contractAddress }),
        ),
);

const createStakingMemoizedSelector = createWeakMapSelector.withTypes<
    HomeAssetTableState & TransactionsRootState
>();

export const selectWalletAssetUnstakedAccounts = createStakingMemoizedSelector(
    [selectWalletAssetAccounts, selectTransactions],
    (accounts, transactions): readonly Account[] =>
        returnStableArrayIfEmpty(
            accounts
                .filter(
                    account =>
                        !isAccountStakingActiveByHistory(account, transactions[account.key] ?? []),
                )
                .sort(
                    (left, right) =>
                        new BigNumber(right.formattedBalance).comparedTo(left.formattedBalance) ??
                        0,
                ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

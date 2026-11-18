import { shallowEqual } from 'react-redux';

import { selectIsStakingAccountActive } from '@suite-common/earn-staking';
import { type WalletAssetKey, selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { hasAccountOrTokenSpendableBalance } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { selectDeviceAssetAccounts } from './assetAccountsSelectors';
import {
    type HomeAssetTableState,
    selectWalletAssetContractAddress,
} from './homeAssetTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const selectState = (state: HomeAssetTableState) => state;

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

export const selectWalletAssetUnstakedAccounts = createMemoizedSelector(
    [selectState, selectWalletAssetAccounts],
    (state, accounts): readonly Account[] =>
        returnStableArrayIfEmpty(
            accounts
                .filter(account => !selectIsStakingAccountActive(state, account.key))
                .sort(
                    (left, right) =>
                        new BigNumber(right.formattedBalance).comparedTo(left.formattedBalance) ??
                        0,
                ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

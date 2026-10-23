import { shallowEqual } from 'react-redux';

import {
    type WalletAssetKey,
    selectAccounts,
    selectDeviceAssetAccounts,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

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

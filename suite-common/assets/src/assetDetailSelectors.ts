import { shallowEqual } from 'react-redux';

import {
    type WalletAssetKey,
    selectAccounts,
    selectDeviceAssetAccounts,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { type HomeAssetTableState } from './homeAssetTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const NO_ACCOUNT_KEYS: readonly AccountKey[] = [];

const selectAccountKeysByAssetKey = createMemoizedSelector(
    [selectDeviceAssetAccounts],
    (assetAccounts): ReadonlyMap<WalletAssetKey, readonly AccountKey[]> =>
        assetAccounts.reduce((byAssetKey, { assetKey, accountKey }) => {
            const keys = byAssetKey.get(assetKey);

            if (keys === undefined) {
                byAssetKey.set(assetKey, [accountKey]);
            } else {
                keys.push(accountKey);
            }

            return byAssetKey;
        }, new Map<WalletAssetKey, AccountKey[]>()),
);

export const selectWalletAssetAccountKeys = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
) => selectAccountKeysByAssetKey(state).get(assetKey) ?? NO_ACCOUNT_KEYS;

export const selectWalletAssetAccounts = createMemoizedSelector(
    [selectWalletAssetAccountKeys, selectAccounts],
    (accountKeys, accounts): readonly Account[] =>
        returnStableArrayIfEmpty(accounts.filter(account => accountKeys.includes(account.key))),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

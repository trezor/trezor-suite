import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { type AssetAccountsRootState, createAssetAccountsSelector } from './assetAccountsSelectors';
import { type AssetTableSelectors, createAssetTableSelectors } from './homeAssetTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetAccountsRootState>();

const selectorsByAccountKey = new Map<AccountKey, AssetTableSelectors>();

export const getAccountAssetTableSelectors = (accountKey: AccountKey): AssetTableSelectors => {
    const held = selectorsByAccountKey.get(accountKey);

    if (held !== undefined) {
        return held;
    }

    const selectAccounts = createMemoizedSelector(
        [(state: AssetAccountsRootState) => selectAccountByKey(state, accountKey)],
        account => returnStableArrayIfEmpty(account === null ? [] : [account]),
    );
    const selectors = createAssetTableSelectors({
        selectAccounts,
        selectAssetAccounts: createAssetAccountsSelector(selectAccounts),
        isSingleAccount: true,
    });

    selectorsByAccountKey.set(accountKey, selectors);

    return selectors;
};

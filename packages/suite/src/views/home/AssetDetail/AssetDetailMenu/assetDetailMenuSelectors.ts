import { type HomeAssetTableState, selectWalletAssetSymbol } from '@suite-common/assets';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

export const selectWalletAssetSignVerifyAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectWalletAssetSymbol],
    (accounts, symbol) =>
        returnStableArrayIfEmpty(
            accounts.filter(
                account => account.symbol === symbol && hasNetworkFeatures(account, 'sign-verify'),
            ),
        ),
);

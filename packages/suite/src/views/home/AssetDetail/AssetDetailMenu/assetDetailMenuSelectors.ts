import { selectWalletAssetSymbol } from '@suite-common/assets';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { type AppState } from 'src/types/suite';

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

export const selectWalletAssetSignVerifyAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectWalletAssetSymbol],
    (accounts, symbol) =>
        returnStableArrayIfEmpty(
            accounts.filter(
                account => account.symbol === symbol && hasNetworkFeatures(account, 'sign-verify'),
            ),
        ),
);

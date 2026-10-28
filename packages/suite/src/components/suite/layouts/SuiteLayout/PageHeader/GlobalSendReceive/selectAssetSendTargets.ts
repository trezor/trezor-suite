import {
    type AssetAccountsRootState,
    type WalletAssetKey,
    selectDeviceAssetAccounts,
    selectVisibleDeviceAccountsMap,
} from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { type GlobalSendTarget } from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetAccountsRootState>();

export const selectAssetSendTargets = createMemoizedSelector(
    [
        selectDeviceAssetAccounts,
        selectVisibleDeviceAccountsMap,
        (_state: AssetAccountsRootState, assetKey: WalletAssetKey) => assetKey,
    ],
    (assetAccounts, accountsByKey, assetKey): GlobalSendTarget[] =>
        returnStableArrayIfEmpty(
            assetAccounts.flatMap((assetAccount): GlobalSendTarget[] => {
                const account = accountsByKey.get(assetAccount.accountKey);

                if (assetAccount.assetKey !== assetKey || account === undefined) {
                    return [];
                }

                const { contractAddress } = assetAccount;

                if (contractAddress === undefined && !isPositiveBalance(account.balance)) {
                    return [];
                }

                return [{ account, contractAddress }];
            }),
        ),
);

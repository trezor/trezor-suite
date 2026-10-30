import {
    selectAssetTokenInfo,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type WalletAssetKey,
    selectExplorer,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { getTokenExplorerUrl, hasNetworkFeatures } from '@suite-common/wallet-utils';
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

export const selectWalletAssetTokenInfo = (
    state: AppState,
    assetKey: WalletAssetKey | undefined,
) => {
    const symbol = selectWalletAssetSymbol(state, assetKey);
    const contractAddress = selectWalletAssetContractAddress(state, assetKey);

    return symbol === undefined || contractAddress === undefined
        ? null
        : selectAssetTokenInfo(state, symbol, contractAddress);
};

export const selectWalletAssetExplorerUrl = (
    state: AppState,
    assetKey: WalletAssetKey | undefined,
): string | undefined => {
    const symbol = selectWalletAssetSymbol(state, assetKey);
    const explorer = selectExplorer(state, symbol);

    if (symbol === undefined || explorer === undefined) {
        return undefined;
    }

    const tokenInfo = selectWalletAssetTokenInfo(state, assetKey);

    return tokenInfo === null
        ? `${explorer.base}${explorer.queryString ?? ''}`
        : getTokenExplorerUrl(explorer, getNetwork(symbol).networkType, tokenInfo);
};

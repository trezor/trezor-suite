import { getNetwork } from '@suite-common/wallet-config';
import { type ExplorerState, type WalletAssetKey, selectExplorer } from '@suite-common/wallet-core';
import { getTokenExplorerUrl } from '@suite-common/wallet-utils';

import { type AssetsRootState, selectAssetTokenInfo } from './assetSelectors';
import {
    type AssetTableState,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from './homeAssetTableSelectors';

type AssetTokenInfoState = AssetsRootState & AssetTableState;

export type AssetExplorerState = AssetTokenInfoState & ExplorerState;

export const selectWalletAssetTokenInfo = (
    state: AssetTokenInfoState,
    assetKey: WalletAssetKey | undefined,
) => {
    const networkSymbol = selectWalletAssetNetworkSymbol(state, assetKey);
    const contractAddress = selectWalletAssetContractAddress(state, assetKey);

    return networkSymbol === undefined || contractAddress === undefined
        ? null
        : selectAssetTokenInfo(state, networkSymbol, contractAddress);
};

export const selectWalletAssetExplorerUrl = (
    state: AssetExplorerState,
    assetKey: WalletAssetKey | undefined,
): string | undefined => {
    const networkSymbol = selectWalletAssetNetworkSymbol(state, assetKey);
    const explorer = selectExplorer(state, networkSymbol);

    if (networkSymbol === undefined || explorer === undefined) {
        return undefined;
    }

    const tokenInfo = selectWalletAssetTokenInfo(state, assetKey);

    return tokenInfo === null
        ? `${explorer.base}${explorer.queryString ?? ''}`
        : getTokenExplorerUrl(explorer, getNetwork(networkSymbol).networkType, tokenInfo);
};

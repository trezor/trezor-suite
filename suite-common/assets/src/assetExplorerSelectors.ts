import { getNetwork } from '@suite-common/wallet-config';
import { type ExplorerState, type WalletAssetKey, selectExplorer } from '@suite-common/wallet-core';
import { getTokenExplorerUrl } from '@suite-common/wallet-utils';

import { type AssetsRootState, selectAssetTokenInfo } from './assetSelectors';
import {
    type HomeAssetTableState,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
} from './homeAssetTableSelectors';

type AssetTokenInfoState = AssetsRootState & HomeAssetTableState;

export type AssetExplorerState = AssetTokenInfoState & ExplorerState;

export const selectWalletAssetTokenInfo = (
    state: AssetTokenInfoState,
    assetKey: WalletAssetKey | undefined,
) => {
    const symbol = selectWalletAssetSymbol(state, assetKey);
    const contractAddress = selectWalletAssetContractAddress(state, assetKey);

    return symbol === undefined || contractAddress === undefined
        ? null
        : selectAssetTokenInfo(state, symbol, contractAddress);
};

export const selectWalletAssetExplorerUrl = (
    state: AssetExplorerState,
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

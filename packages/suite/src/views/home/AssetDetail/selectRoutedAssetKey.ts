import { type RouterRootState, selectRouterParams } from '@suite/router';
import {
    type HomeAssetTableState,
    selectWalletAssetKey,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { toTokenAddress } from '@suite-common/wallet-types';

export type RoutedAssetState = RouterRootState & HomeAssetTableState;

export const selectRoutedAssetKey = (state: RoutedAssetState): WalletAssetKey | undefined => {
    const params = selectRouterParams(state);

    if (params === undefined || !('symbol' in params) || params.symbol === undefined) {
        return undefined;
    }

    const contractAddress = 'contractAddress' in params ? params.contractAddress : undefined;
    const assetKey = selectWalletAssetKey(
        state,
        params.symbol,
        contractAddress === undefined ? undefined : toTokenAddress(contractAddress),
    );

    return assetKey !== undefined && selectWalletAssetSymbol(state, assetKey) !== undefined
        ? assetKey
        : undefined;
};

import {
    type HomeAssetTableState,
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey, isSupportedStakingNetworkSymbol } from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';

const selectIsWalletAssetStakingSupported = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey | undefined,
): boolean => {
    const networkSymbol = selectWalletAssetSymbol(state, assetKey);

    return (
        networkSymbol !== undefined &&
        selectWalletAssetContractAddress(state, assetKey) === undefined &&
        isSupportedStakingNetworkSymbol(networkSymbol)
    );
};

export const selectShouldShowWalletAssetEarnSection = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey | undefined,
): boolean => {
    const amount = selectWalletAssetAmount(state, assetKey);

    return (
        amount !== undefined &&
        isPositiveBalance(amount) &&
        selectIsWalletAssetStakingSupported(state, assetKey)
    );
};

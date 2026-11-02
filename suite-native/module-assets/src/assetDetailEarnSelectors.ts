import {
    type HomeAssetTableState,
    selectWalletAssetAvailableAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetStakingAmount,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { type StakeRootState, type WalletAssetKey, selectApy } from '@suite-common/wallet-core';
import { isApyAvailable, isPositiveBalance } from '@suite-common/wallet-utils';

export type AssetDetailEarnState = HomeAssetTableState & StakeRootState;

export const selectShouldShowWalletAssetEarnSection = (
    state: AssetDetailEarnState,
    assetKey: WalletAssetKey | undefined,
) => {
    const stakingAmount = selectWalletAssetStakingAmount(state, assetKey);

    if (isPositiveBalance(stakingAmount)) {
        return true;
    }

    const networkSymbol = selectWalletAssetSymbol(state, assetKey);
    const contractAddress = selectWalletAssetContractAddress(state, assetKey);

    return (
        networkSymbol !== undefined &&
        contractAddress === undefined &&
        isApyAvailable(selectApy(state, { networkSymbol }))
    );
};

export const selectShouldShowWalletAssetEarnBanner = (
    state: AssetDetailEarnState,
    assetKey: WalletAssetKey | undefined,
) => {
    const availableAmount = selectWalletAssetAvailableAmount(state, assetKey);
    const stakingAmount = selectWalletAssetStakingAmount(state, assetKey);

    return (
        availableAmount !== undefined &&
        isPositiveBalance(availableAmount) &&
        !isPositiveBalance(stakingAmount) &&
        selectShouldShowWalletAssetEarnSection(state, assetKey)
    );
};

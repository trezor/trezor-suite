import {
    type HomeAssetTableState,
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetUnstakedAccounts,
} from '@suite-common/assets';
import {
    selectIsStakingSupportedSymbol,
    selectStakeableStakingProductDescriptorBySymbol,
} from '@suite-common/earn-staking';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { type BannerFlagsSliceRootState, selectIsEarnBannerClosed } from '@suite-native/banners';

export type AssetDetailStakingBannerState = HomeAssetTableState & BannerFlagsSliceRootState;

const NO_ACCOUNTS: readonly Account[] = [];

const selectIsWalletAssetStakingSupported = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey | undefined,
): boolean => {
    const networkSymbol = selectWalletAssetNetworkSymbol(state, assetKey);

    return (
        networkSymbol !== undefined &&
        selectWalletAssetContractAddress(state, assetKey) === undefined &&
        selectIsStakingSupportedSymbol(state, networkSymbol)
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

// The banner promotes a product the platform can stake into.
export const selectWalletAssetStakingBannerAccounts = (
    state: AssetDetailStakingBannerState,
    assetKey: WalletAssetKey | undefined,
): readonly Account[] => {
    const networkSymbol = selectWalletAssetNetworkSymbol(state, assetKey);

    if (
        networkSymbol === undefined ||
        !selectIsWalletAssetStakingSupported(state, assetKey) ||
        selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol) === null ||
        selectIsEarnBannerClosed(state, networkSymbol)
    ) {
        return NO_ACCOUNTS;
    }

    return selectWalletAssetUnstakedAccounts(state, assetKey);
};

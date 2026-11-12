import {
    type HomeAssetTableState,
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
    selectWalletAssetUnstakedAccounts,
} from '@suite-common/assets';
import {
    type WalletAssetKey,
    getStakingLimitsByNetworkSymbol,
    isSupportedStakingNetworkSymbol,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { type BannerFlagsSliceRootState, selectIsEarnBannerClosed } from '@suite-native/banners';

export type AssetDetailStakingBannerState = HomeAssetTableState & BannerFlagsSliceRootState;

const NO_ACCOUNTS: readonly Account[] = [];

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

export const selectWalletAssetStakingBannerAccounts = (
    state: AssetDetailStakingBannerState,
    assetKey: WalletAssetKey | undefined,
): readonly Account[] => {
    const networkSymbol = selectWalletAssetSymbol(state, assetKey);

    if (
        networkSymbol === undefined ||
        !selectIsWalletAssetStakingSupported(state, assetKey) ||
        getStakingLimitsByNetworkSymbol(networkSymbol) === null ||
        selectIsEarnBannerClosed(state, networkSymbol)
    ) {
        return NO_ACCOUNTS;
    }

    return selectWalletAssetUnstakedAccounts(state, assetKey);
};

import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type HomeAssetTableState, selectWalletAssetKey } from '@suite-common/assets';
import { useNativeYieldVault } from '@suite-common/earn-stablecoin';
import { Box } from '@suite-native/atoms';
import { EthEarnPromoBanner } from '@suite-native/banners';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';

import { AssetDetailStakingRewardsBanner } from './AssetDetailStakingRewardsBanner';
import { useNavigateToEarn } from './useNavigateToEarn';
import {
    type AssetDetailStakingBannerState,
    selectWalletAssetStakingBannerAccounts,
} from '../assetDetailEarnSelectors';

export const AssetDetailStakingBanner = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const accounts = useSelector((state: AssetDetailStakingBannerState) =>
        selectWalletAssetStakingBannerAccounts(state, assetKey),
    );
    const account = accounts.at(0);
    const { hasYieldOption } = useNativeYieldVault({ account });
    const navigateToEarn = useNavigateToEarn();

    if (account === undefined) {
        return null;
    }

    return (
        <Box paddingHorizontal="sp20">
            {hasYieldOption ? (
                <EthEarnPromoBanner account={account} onExplore={navigateToEarn} />
            ) : (
                <AssetDetailStakingRewardsBanner
                    networkSymbol={networkSymbol}
                    accounts={accounts}
                    onExplore={navigateToEarn}
                />
            )}
        </Box>
    );
};

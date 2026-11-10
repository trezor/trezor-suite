import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAvailableAmount,
    selectWalletAssetKey,
    selectWalletAssetStakingAmount,
} from '@suite-common/assets';
import { getNetworkType } from '@suite-common/wallet-config';
import { Divider, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';

import { AssetDetailEarnBalanceBar } from './AssetDetailEarnBalanceBar';
import { AssetDetailEarnBalanceRow } from './AssetDetailEarnBalanceRow';
import { AssetDetailEarnStakingRate } from './AssetDetailEarnStakingRate';
import { AssetDetailSectionHeader } from './AssetDetailSectionHeader';
import { useNavigateToEarn } from './useNavigateToEarn';
import { selectShouldShowWalletAssetEarnSection } from '../assetDetailEarnSelectors';

export const AssetDetailEarnSection = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const availableAmount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAvailableAmount(state, assetKey),
    );
    const stakingAmount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetStakingAmount(state, assetKey),
    );
    const isEarnAvailable = useSelector((state: HomeAssetTableState) =>
        selectShouldShowWalletAssetEarnSection(state, assetKey),
    );
    const navigateToEarn = useNavigateToEarn();

    if (availableAmount === undefined || stakingAmount === undefined || !isEarnAvailable) {
        return null;
    }

    // A Cardano delegation leaves the whole balance spendable, so the rest is unstaked, not the
    // only part available.
    const unstakedType = getNetworkType(networkSymbol) === 'cardano' ? 'unstaked' : 'available';

    return (
        <>
            <Divider />
            <VStack paddingHorizontal="sp20" spacing="sp12">
                <AssetDetailSectionHeader
                    title={<Translation id="moduleAssets.assetDetailScreen.earnSection.title" />}
                    linkLabel={
                        <Translation id="moduleAssets.assetDetailScreen.earnSection.viewAll" />
                    }
                    onPress={navigateToEarn}
                    testID="@assets/asset-detail/earn-view-all-button"
                />

                <AssetDetailEarnBalanceBar assetKey={assetKey} unstakedType={unstakedType} />
                <AssetDetailEarnBalanceRow amount={availableAmount} type={unstakedType} />
                <AssetDetailEarnBalanceRow
                    amount={stakingAmount}
                    type="staked"
                    amountLabel={<AssetDetailEarnStakingRate />}
                />
            </VStack>
        </>
    );
};

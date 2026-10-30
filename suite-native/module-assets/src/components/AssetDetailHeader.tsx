import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type HomeAssetEarnState,
    type HomeAssetTableState,
    selectWalletAssetEarnAvailable,
    selectWalletAssetKey,
} from '@suite-common/assets';
import { Divider, VStack } from '@suite-native/atoms';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';

import { AssetDetailBalanceSection } from './AssetDetailBalanceSection';
import { AssetDetailEarnSection } from './AssetDetailEarnSection';
import { AssetDetailPriceSection } from './AssetDetailPriceSection';

export const AssetDetailHeader = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const shouldShowEarnSection = useSelector((state: HomeAssetEarnState) =>
        selectWalletAssetEarnAvailable(state, assetKey),
    );

    return (
        <VStack spacing="sp20">
            <AssetDetailPriceSection />
            <Divider />
            <AssetDetailBalanceSection />
            {shouldShowEarnSection && <Divider />}
            {shouldShowEarnSection && <AssetDetailEarnSection />}
        </VStack>
    );
};

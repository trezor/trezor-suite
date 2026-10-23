import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AssetsRootState, selectAssetName } from '@suite-common/assets';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';
import { AssetPriceChart } from '@suite-native/price-chart';

import { AssetDetailPrice } from './AssetDetailPrice';

export const AssetDetailPriceSection = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetName = useSelector((state: AssetsRootState) =>
        selectAssetName(state, networkSymbol, tokenContract),
    );

    return (
        <VStack spacing="sp12" paddingHorizontal="sp16" paddingVertical="sp8">
            <HStack alignItems="center" spacing="sp8">
                <TokenIcon
                    networkSymbol={networkSymbol}
                    contractAddress={tokenContract}
                    tokenSymbol={assetName}
                    showNetworkIcon
                    size="extraSmall"
                />
                <Text variant="body-md-strong">{assetName}</Text>
            </HStack>

            <AssetDetailPrice networkSymbol={networkSymbol} tokenContract={tokenContract} />
            <AssetPriceChart networkSymbol={networkSymbol} tokenContract={tokenContract} />
        </VStack>
    );
};

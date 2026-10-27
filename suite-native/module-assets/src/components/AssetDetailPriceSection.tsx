import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AssetsRootState, selectAssetName } from '@suite-common/assets';
import { HStack, VStack } from '@suite-native/atoms';
import { TokenName } from '@suite-native/formatters';
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
                <TokenName
                    text={assetName}
                    networkSymbol={networkSymbol}
                    tokenContract={tokenContract}
                    variant="body-md-strong"
                />
            </HStack>

            <AssetDetailPrice networkSymbol={networkSymbol} tokenContract={tokenContract} />
            <AssetPriceChart networkSymbol={networkSymbol} tokenContract={tokenContract} />
        </VStack>
    );
};

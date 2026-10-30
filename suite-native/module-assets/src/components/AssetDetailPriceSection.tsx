import { type RouteProp, useRoute } from '@react-navigation/native';

import { Box, VStack } from '@suite-native/atoms';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';
import { AssetPriceChart } from '@suite-native/price-chart';

import { AssetDetailPrice } from './AssetDetailPrice';

export const AssetDetailPriceSection = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;

    return (
        <VStack spacing="sp24" paddingTop="sp24">
            <Box paddingHorizontal="sp20">
                <AssetDetailPrice networkSymbol={networkSymbol} tokenContract={tokenContract} />
            </Box>
            <AssetPriceChart networkSymbol={networkSymbol} tokenContract={tokenContract} />
        </VStack>
    );
};

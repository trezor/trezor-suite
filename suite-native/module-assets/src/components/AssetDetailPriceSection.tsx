import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { selectIsTokenFiatRateDisallowed } from '@suite-common/wallet-core';
import { Divider, VStack } from '@suite-native/atoms';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';
import { AssetPriceChart } from '@suite-native/price-chart';

import { AssetDetailPrice } from './AssetDetailPrice';

export const AssetDetailPriceSection = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const isFiatRateDisallowed = useSelector((state: TokenDefinitionsRootState) =>
        selectIsTokenFiatRateDisallowed(state, networkSymbol, tokenContract),
    );

    if (isFiatRateDisallowed) {
        return null;
    }

    return (
        <>
            <VStack spacing="sp24" paddingTop="sp24">
                <AssetDetailPrice networkSymbol={networkSymbol} tokenContract={tokenContract} />
                <AssetPriceChart networkSymbol={networkSymbol} tokenContract={tokenContract} />
            </VStack>
            <Divider />
        </>
    );
};

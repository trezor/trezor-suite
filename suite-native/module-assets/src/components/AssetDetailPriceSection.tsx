import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AssetsRootState, selectAssetName, selectAssetTokenInfo } from '@suite-common/assets';
import { isErc4626 } from '@suite-common/wallet-utils';
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
    const token = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );
    const isPriceHistorySupported = !isErc4626(token);

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
            {isPriceHistorySupported && (
                <AssetPriceChart networkSymbol={networkSymbol} tokenContract={tokenContract} />
            )}
        </VStack>
    );
};

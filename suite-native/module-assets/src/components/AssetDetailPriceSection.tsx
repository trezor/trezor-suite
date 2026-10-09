import { useSelector } from 'react-redux';

import { type AssetsRootState, selectAssetTicker } from '@suite-common/assets';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';

import { AssetDetailPrice } from './AssetDetailPrice';
import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

export const AssetDetailPriceSection = () => {
    const { networkSymbol, tokenContract } = useAssetDetailRouteParams();

    const assetTicker = useSelector((state: AssetsRootState) =>
        selectAssetTicker(state, networkSymbol, tokenContract),
    );

    return (
        <VStack spacing="sp12" paddingHorizontal="sp16" paddingVertical="sp8">
            <HStack alignItems="center" spacing="sp8">
                <TokenIcon
                    networkSymbol={networkSymbol}
                    contractAddress={tokenContract}
                    tokenSymbol={assetTicker}
                    showNetworkIcon
                    size="extraSmall"
                />
                <Text variant="body-md-strong">{assetTicker}</Text>
            </HStack>

            <AssetDetailPrice />
        </VStack>
    );
};

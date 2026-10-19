import { useSelector } from 'react-redux';

import { type HomeAssetTableState, selectWalletAssetDisplaySymbol } from '@suite-common/assets';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';

import { AssetDetailPrice } from './AssetDetailPrice';
import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

export const AssetDetailPriceSection = () => {
    const { assetKey, networkSymbol, tokenContract } = useAssetDetailAsset();

    const assetDisplaySymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetDisplaySymbol(state, assetKey),
    );

    if (networkSymbol === undefined || assetDisplaySymbol === undefined) return null;

    return (
        <VStack spacing="sp12" paddingHorizontal="sp16" paddingVertical="sp8">
            <HStack alignItems="center" spacing="sp8">
                <TokenIcon
                    networkSymbol={networkSymbol}
                    contractAddress={tokenContract}
                    tokenSymbol={assetDisplaySymbol}
                    showNetworkIcon
                    size="extraSmall"
                />
                <Text variant="body-md-strong">{assetDisplaySymbol}</Text>
            </HStack>

            <AssetDetailPrice />
        </VStack>
    );
};

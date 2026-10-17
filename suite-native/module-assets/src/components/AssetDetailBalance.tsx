import { useSelector } from 'react-redux';

import {
    type AssetsRootState,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetName,
} from '@suite-common/assets';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { AssetDetailBalanceBreakdown } from './AssetDetailBalanceBreakdown';
import { AssetDetailBalanceValues } from './AssetDetailBalanceValues';
import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

export const AssetDetailBalance = () => {
    const { assetKey, networkSymbol, tokenContract } = useAssetDetailAsset();

    const assetDisplaySymbol = useSelector((state: AssetsRootState) =>
        selectWalletAssetDisplaySymbol(state, assetKey),
    );
    const assetName = useSelector((state: AssetsRootState) =>
        selectWalletAssetName(state, assetKey),
    );

    if (
        networkSymbol === undefined ||
        assetDisplaySymbol === undefined ||
        assetName === undefined
    ) {
        return null;
    }

    return (
        <VStack paddingHorizontal="sp20" paddingVertical="sp24" spacing="sp16">
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="moduleAssets.assetDetailScreen.balanceSection.title" />
            </Text>

            <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
                <HStack alignItems="center" spacing="sp12" flex={1}>
                    <TokenIcon
                        networkSymbol={networkSymbol}
                        contractAddress={tokenContract}
                        tokenSymbol={assetDisplaySymbol}
                        showNetworkIcon
                        size="medium"
                    />
                    <VStack spacing={0} flex={1}>
                        <Text variant="body-md-strong" numberOfLines={1} adjustsFontSizeToFit>
                            {assetDisplaySymbol}
                        </Text>
                        <Text
                            variant="body-sm"
                            color="contentSecondary"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {assetName}
                        </Text>
                    </VStack>
                </HStack>

                <AssetDetailBalanceValues />
            </HStack>

            <AssetDetailBalanceBreakdown />
        </VStack>
    );
};

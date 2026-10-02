import { useSelector } from 'react-redux';

import { type AssetsRootState, selectAssetName, selectAssetTicker } from '@suite-common/assets';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { AssetDetailBalanceBreakdown } from './AssetDetailBalanceBreakdown';
import { AssetDetailBalanceValues } from './AssetDetailBalanceValues';
import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

export const AssetDetailBalance = () => {
    const { networkSymbol, tokenContract } = useAssetDetailRouteParams();

    const assetTicker = useSelector((state: AssetsRootState) =>
        selectAssetTicker(state, networkSymbol, tokenContract),
    );
    const assetName = useSelector((state: AssetsRootState) =>
        selectAssetName(state, networkSymbol, tokenContract),
    );

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
                        tokenSymbol={assetTicker}
                        showNetworkIcon
                        size="medium"
                    />
                    <VStack spacing={0} flex={1}>
                        <Text variant="body-md-strong" numberOfLines={1} adjustsFontSizeToFit>
                            {assetTicker}
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

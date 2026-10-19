import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetAccountCount,
    selectWalletAssetDisplaySymbol,
} from '@suite-common/assets';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AssetDetailBalanceValues } from './AssetDetailBalanceValues';
import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

export const AssetDetailBalance = () => {
    const { assetKey, networkSymbol } = useAssetDetailAsset();

    const assetDisplaySymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetDisplaySymbol(state, assetKey),
    );
    const accountCount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAccountCount(state, assetKey),
    );

    if (
        networkSymbol === undefined ||
        assetDisplaySymbol === undefined ||
        accountCount === undefined
    ) {
        return null;
    }

    return (
        <VStack paddingHorizontal="sp20" paddingVertical="sp24" spacing="sp16">
            <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
                <Text variant="body-xs" color="contentSecondary">
                    <Translation id="moduleAssets.assetDetailScreen.balanceSection.title" />
                </Text>
                <Text variant="body-xs" color="contentSecondary">
                    <Translation
                        id="moduleAssets.assetDetailScreen.balanceSection.accountCount"
                        values={{ count: accountCount }}
                    />
                </Text>
            </HStack>

            <AssetDetailBalanceValues assetDisplaySymbol={assetDisplaySymbol} />
        </VStack>
    );
};

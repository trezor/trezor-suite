import { type RouteProp, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { AssetSymbol } from '@suite-native/assets';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import { TokenIcon } from '@suite-native/tokens';

export const AssetDetailScreenHeaderContent = () => {
    const { NetworkNameFormatter } = useFormatters();
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;

    return (
        <HStack alignItems="center" spacing="sp8" flexShrink={1}>
            <TokenIcon
                networkSymbol={networkSymbol}
                contractAddress={tokenContract}
                showNetworkIcon
                size="small"
            />

            <VStack spacing={0} flexShrink={1}>
                <AssetSymbol
                    isTruncated
                    networkSymbol={networkSymbol}
                    contractAddress={tokenContract}
                    variant="body-md-strong"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                />
                <Text
                    variant="body-xs"
                    color="contentSecondary"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    <NetworkNameFormatter value={networkSymbol} />
                </Text>
            </VStack>
        </HStack>
    );
};

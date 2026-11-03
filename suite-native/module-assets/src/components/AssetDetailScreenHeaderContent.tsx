import { type RouteProp, useRoute } from '@react-navigation/native';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import { TokenName } from '@suite-native/tokens';

type AssetDetailScreenHeaderContentProps = {
    assetDisplaySymbol: string;
};

export const AssetDetailScreenHeaderContent = ({
    assetDisplaySymbol,
}: AssetDetailScreenHeaderContentProps) => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;

    return (
        <HStack alignItems="center" spacing="sp8" flexShrink={1}>
            <TokenIcon
                networkSymbol={networkSymbol}
                contractAddress={tokenContract}
                tokenSymbol={assetDisplaySymbol}
                showNetworkIcon
                size="small"
            />

            <VStack spacing={0} flexShrink={1}>
                <TokenName
                    text={assetDisplaySymbol}
                    networkSymbol={networkSymbol}
                    tokenContract={tokenContract}
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
                    {getNetworkDisplaySymbolName(networkSymbol)}
                </Text>
            </VStack>
        </HStack>
    );
};

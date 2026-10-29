import { type NetworkSymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';

type AssetDetailScreenHeaderContentProps = {
    assetDisplaySymbol: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetDetailScreenHeaderContent = ({
    assetDisplaySymbol,
    networkSymbol,
    tokenContract,
}: AssetDetailScreenHeaderContentProps) => (
    <HStack alignItems="center" spacing="sp8" flexShrink={1}>
        <TokenIcon
            networkSymbol={networkSymbol}
            contractAddress={tokenContract}
            tokenSymbol={assetDisplaySymbol}
            showNetworkIcon
            size="small"
        />

        <VStack spacing={0} flexShrink={1}>
            <Text variant="body-md-strong" numberOfLines={1} ellipsizeMode="tail">
                {assetDisplaySymbol}
            </Text>
            <Text variant="body-xs" color="contentSecondary" numberOfLines={1} ellipsizeMode="tail">
                {getNetworkDisplaySymbolName(networkSymbol)}
            </Text>
        </VStack>
    </HStack>
);

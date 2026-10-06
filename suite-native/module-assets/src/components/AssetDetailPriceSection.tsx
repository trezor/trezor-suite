import { useSelector } from 'react-redux';

import { type AssetsRootState, selectAssetName } from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';

import { AssetDetailPrice } from './AssetDetailPrice';

type AssetDetailPriceSectionProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetDetailPriceSection = ({
    networkSymbol,
    tokenContract,
}: AssetDetailPriceSectionProps) => {
    const assetName = useSelector((state: AssetsRootState) =>
        selectAssetName(state, networkSymbol, tokenContract),
    );

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
        </VStack>
    );
};

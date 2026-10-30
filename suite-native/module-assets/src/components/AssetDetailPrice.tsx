import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { AssetPriceChange, useAssetPrice } from '@suite-native/assets';
import { Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountHeaderFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

type AssetDetailPriceProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetDetailPrice = ({ networkSymbol, tokenContract }: AssetDetailPriceProps) => {
    const { price, sevenDayValueChange, sevenDayPercentageChange } = useAssetPrice({
        networkSymbol,
        tokenContract,
    });

    return (
        <VStack spacing="sp12">
            <Text variant="body-xs" color="contentSecondary">
                <Translation id="moduleAssets.assetDetailScreen.priceSection.title" />
            </Text>
            <VStack spacing="sp16">
                <BaseCurrencyAmountHeaderFormatter value={price} isDiscreetText={false} />
                {sevenDayPercentageChange !== null && (
                    <AssetPriceChange
                        valueChange={sevenDayValueChange}
                        percentageChange={sevenDayPercentageChange}
                    />
                )}
            </VStack>
        </VStack>
    );
};

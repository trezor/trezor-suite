import { AssetPriceChange, useAssetPrice } from '@suite-native/assets';
import { VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountHeaderFormatter } from '@suite-native/formatters';

import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

export const AssetDetailPrice = () => {
    const { networkSymbol, tokenContract } = useAssetDetailAsset();

    const { price, sevenDayValueChange, sevenDayPercentageChange } = useAssetPrice({
        networkSymbol,
        tokenContract,
    });

    return (
        <VStack spacing="sp12">
            <BaseCurrencyAmountHeaderFormatter value={price} isDiscreetText={false} />
            {sevenDayPercentageChange !== null && (
                <AssetPriceChange
                    valueChange={sevenDayValueChange}
                    percentageChange={sevenDayPercentageChange}
                />
            )}
        </VStack>
    );
};

import { AssetPriceChange, useAssetPrice } from '@suite-native/assets';
import { VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountHeaderFormatter } from '@suite-native/formatters';

import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

export const AssetDetailPrice = () => {
    const { networkSymbol, tokenContract } = useAssetDetailRouteParams();

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

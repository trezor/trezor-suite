import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { AssetPriceChange, useAssetPrice } from '@suite-native/assets';
import { VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountHeaderFormatter } from '@suite-native/formatters';

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

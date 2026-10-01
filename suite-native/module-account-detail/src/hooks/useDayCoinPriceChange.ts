import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { useAssetPriceQuery } from '@suite-native/assets';

type UseDayCoinPriceChangeProps = {
    symbol?: NetworkSymbol | null;
    tokenContract?: TokenAddress;
    isErc4626Token?: boolean;
};

export const useDayCoinPriceChange = ({
    symbol,
    tokenContract,
    isErc4626Token,
}: UseDayCoinPriceChangeProps) => {
    const { price, sevenDayPercentageChange, isLoading, underlyingAssetContract } =
        useAssetPriceQuery({
            networkSymbol: symbol,
            tokenContract,
            isErc4626Token,
        });

    return {
        currentValue: price,
        valuePercentageChange: sevenDayPercentageChange,
        isLoading,
        underlyingAssetContract,
    };
};

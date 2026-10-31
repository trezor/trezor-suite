import { useSelector } from 'react-redux';

import { selectAssetPriceChartRange } from '@suite/flags';
import { useAssetPriceHistoryQuery } from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';

type UseAssetPriceChartStateParams = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const useAssetPriceChartState = ({
    networkSymbol,
    tokenContract,
}: UseAssetPriceChartStateParams) => {
    const fiatCurrency = useSelector(selectBaseCurrency);
    const range = useSelector(selectAssetPriceChartRange);
    const {
        data: points,
        isLoading,
        isError,
    } = useAssetPriceHistoryQuery({
        ticker: { symbol: networkSymbol, tokenAddress: tokenContract },
        fiatCurrency,
        range,
    });

    return {
        points,
        isLoading,
        isError,
        isUnavailable: points === null,
        isEmpty: points?.length === 0,
    };
};

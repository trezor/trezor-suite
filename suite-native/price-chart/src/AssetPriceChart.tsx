import { useSelector } from 'react-redux';

import {
    INITIAL_ASSET_PRICE_CHART_RANGE,
    useAssetPriceHistoryQuery,
} from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import type { TokenAddress } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';

export type AssetPriceChartProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetPriceChart = ({ networkSymbol, tokenContract }: AssetPriceChartProps) => {
    const fiatCurrency = useSelector(selectBaseCurrency);
    const { data, isLoading } = useAssetPriceHistoryQuery({
        ticker: { symbol: networkSymbol, tokenAddress: tokenContract },
        fiatCurrency,
        range: INITIAL_ASSET_PRICE_CHART_RANGE,
    });

    if (isLoading) {
        return <Text variant="body-sm">Loading</Text>;
    }

    if (data === null) {
        return null;
    }

    return (
        <Text variant="body-sm">
            {JSON.stringify({ firstItem: data?.[0] ?? null, length: data?.length ?? 0 })}
        </Text>
    );
};

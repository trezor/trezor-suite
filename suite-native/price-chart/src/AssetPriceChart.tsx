import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    INITIAL_ASSET_PRICE_CHART_RANGE,
    useAssetPriceHistoryQuery,
} from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import type { TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { type GraphPoint, LineGraph } from '@suite-native/react-native-graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AssetPriceChartRangeSelector } from './AssetPriceChartRangeSelector';

export type AssetPriceChartProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

const graphStyle = prepareNativeStyle(() => ({
    height: 184,
    width: '100%',
}));

export const AssetPriceChart = ({ networkSymbol, tokenContract }: AssetPriceChartProps) => {
    const fiatCurrency = useSelector(selectBaseCurrency);
    const [range, setRange] = useState(INITIAL_ASSET_PRICE_CHART_RANGE);
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const { data, isLoading } = useAssetPriceHistoryQuery({
        ticker: { symbol: networkSymbol, tokenAddress: tokenContract },
        fiatCurrency,
        range,
    });
    const points = useMemo<GraphPoint[]>(
        () => data?.map(({ timestamp, price }) => ({ date: new Date(timestamp), value: price })) ?? [],
        [data],
    );

    if (data === null) {
        return null;
    }

    return (
        <VStack spacing="sp16" paddingVertical="sp8">
            <LineGraph
                animated
                color={colors.borderBrand}
                enablePanGesture={false}
                lineThickness={2}
                loading={isLoading}
                loadingLineColor={colors.borderNeutral}
                points={points}
                style={applyStyle(graphStyle)}
            />
            <AssetPriceChartRangeSelector selectedRange={range} onRangeChange={setRange} />
        </VStack>
    );
};

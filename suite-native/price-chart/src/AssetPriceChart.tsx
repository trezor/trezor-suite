import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { useAssetPriceHistoryQuery } from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import type { TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { type GraphPoint } from '@suite-native/react-native-graph';

import { AssetPriceChartRangeSelector } from './AssetPriceChartRangeSelector';
import { PriceChartBody } from './PriceChartBody';
import { assetPriceChartRangeAtom } from './assetPriceChartRangeAtom';

export type AssetPriceChartProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetPriceChart = ({ networkSymbol, tokenContract }: AssetPriceChartProps) => {
    const fiatCurrency = useSelector(selectBaseCurrency);
    const range = useAtomValue(assetPriceChartRangeAtom);
    const { data, isLoading, isError } = useAssetPriceHistoryQuery({
        ticker: { symbol: networkSymbol, tokenAddress: tokenContract },
        fiatCurrency,
        range,
    });
    const points = useMemo<GraphPoint[]>(
        () =>
            data?.map(({ timestamp, price }) => ({ date: new Date(timestamp), value: price })) ??
            [],
        [data],
    );

    if (data === null) {
        return null;
    }

    return (
        <VStack spacing="sp16" paddingVertical="sp8">
            <PriceChartBody
                points={points}
                isLoading={isLoading}
                isError={isError}
                isEmpty={data?.length === 0}
            />
            <AssetPriceChartRangeSelector />
        </VStack>
    );
};

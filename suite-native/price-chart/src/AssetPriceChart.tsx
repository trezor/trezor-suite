import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { useAssetPriceHistoryQuery } from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import type { TokenAddress } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { VStack } from '@suite-native/atoms';
import { type GraphPoint, LineGraph } from '@suite-native/react-native-graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AssetPriceChartRangeSelector } from './AssetPriceChartRangeSelector';
import { assetPriceChartRangeAtom } from './assetPriceChartRangeAtom';

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
    const token = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );
    const isErc4626Token = isErc4626(token);
    const range = useAtomValue(assetPriceChartRangeAtom);
    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const { data, isLoading } = useAssetPriceHistoryQuery({
        ticker: {
            symbol: networkSymbol,
            tokenAddress: tokenContract,
            protocols: isErc4626Token ? ['erc4626'] : undefined,
        },
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
        <VStack spacing="sp24" paddingTop="sp8" paddingBottom="sp12">
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
            <AssetPriceChartRangeSelector />
        </VStack>
    );
};

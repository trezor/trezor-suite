import { useSelector } from 'react-redux';

import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    type TooltipProps,
    XAxis,
    YAxis,
} from 'recharts';
import styled, { useTheme } from 'styled-components';

import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { useFormatters } from '@suite-common/formatters';
import {
    type AssetPricePoint,
    INITIAL_ASSET_PRICE_CHART_RANGE,
    useAssetPriceHistoryQuery,
} from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type TokenAddress, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Skeleton } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

export type AssetPriceChartProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

const CHART_HEIGHT = 240;
const LINE_THICKNESS = 2;

const ChartFrame = styled.div`
    position: relative;
    width: 100%;
    height: ${CHART_HEIGHT}px;
`;

const ChartFill = styled.div`
    position: absolute;
    inset: 0;
`;

const TooltipBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
    border-radius: 8px;
    background: ${({ theme }) => theme.surfaceFillModeless};
    outline: 1px solid ${({ theme }) => theme.surfaceBorderModeless};
    box-shadow: ${({ theme }) => theme.surfaceShadowModeless};
`;

const TooltipPrice = styled.span`
    color: ${({ theme }) => theme.contentPrimary};
    font-size: 14px;
    font-weight: 600;
`;

const TooltipTime = styled.span`
    color: ${({ theme }) => theme.contentTertiary};
    font-size: 12px;
`;

const PriceTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    const { BaseCurrencyAmountFormatter, DateTimeFormatter } = useFormatters();
    const point = payload?.[0]?.payload as AssetPricePoint | undefined;

    if (!active || point === undefined) {
        return null;
    }

    return (
        <TooltipBox data-testid="@price-chart/tooltip">
            <TooltipPrice>
                {BaseCurrencyAmountFormatter.format(
                    asBaseCurrencyAmount(new BigNumber(point.price)),
                )}
            </TooltipPrice>
            <TooltipTime>{DateTimeFormatter.format(point.timestamp)}</TooltipTime>
        </TooltipBox>
    );
};

export const AssetPriceChart = ({ networkSymbol, tokenContract }: AssetPriceChartProps) => {
    const theme = useTheme();
    const fiatCurrency = useSelector(selectBaseCurrency);
    const shouldAnimateSkeleton = useSelector(selectShouldAnimateLoadingSkeleton);
    const { data: points, isLoading } = useAssetPriceHistoryQuery({
        ticker: { symbol: networkSymbol, tokenAddress: tokenContract },
        fiatCurrency,
        range: INITIAL_ASSET_PRICE_CHART_RANGE,
    });

    if (points === null) {
        return null;
    }

    if (isLoading || points === undefined) {
        return (
            <ChartFrame data-testid="@price-chart/skeleton">
                <Skeleton width="100%" height={CHART_HEIGHT} animate={shouldAnimateSkeleton} />
            </ChartFrame>
        );
    }

    return (
        <ChartFrame data-testid="@price-chart/graph">
            <ChartFill>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={points}
                        margin={{
                            top: LINE_THICKNESS,
                            right: 0,
                            bottom: LINE_THICKNESS,
                            left: 0,
                        }}
                    >
                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            hide
                        />
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <Tooltip
                            content={<PriceTooltip />}
                            cursor={{ stroke: theme.borderNeutral, strokeWidth: 1 }}
                            isAnimationActive={false}
                        />
                        <Line
                            dataKey="price"
                            type="monotone"
                            stroke={theme.borderBrand}
                            strokeWidth={LINE_THICKNESS}
                            dot={false}
                            activeDot={{ r: 4, fill: theme.borderBrand, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartFill>
        </ChartFrame>
    );
};

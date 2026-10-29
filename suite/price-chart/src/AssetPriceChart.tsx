import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    Line,
    LineChart,
    ReferenceDot,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    type TooltipProps,
    XAxis,
    YAxis,
} from 'recharts';
import styled, { useTheme } from 'styled-components';

import { selectAssetPriceChartRange } from '@suite/flags';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type AssetPricePoint, useAssetPriceHistoryQuery } from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type TokenAddress, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { Skeleton } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

export type AssetPriceChartProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

const CHART_HEIGHT = 240;
const LINE_THICKNESS = 2;
const LABEL_FONT_SIZE = 12;
const LABEL_GAP = 8;
const LABEL_SPACE = LABEL_FONT_SIZE + LABEL_GAP + 4;
const LABEL_EDGE_SHARE = 0.1;

type PriceExtremes = {
    high: AssetPricePoint;
    low: AssetPricePoint;
    highIndex: number;
    lowIndex: number;
};

const getPriceExtremes = (points: AssetPricePoint[]): PriceExtremes | undefined => {
    const first = points[0];
    if (first === undefined) {
        return undefined;
    }

    return points.reduce<PriceExtremes>(
        (extremes, point, index) => ({
            ...extremes,
            ...(point.price > extremes.high.price && { high: point, highIndex: index }),
            ...(point.price < extremes.low.price && { low: point, lowIndex: index }),
        }),
        { high: first, low: first, highIndex: 0, lowIndex: 0 },
    );
};

const getLabelAnchor = (index: number, count: number) => {
    const share = count > 1 ? index / (count - 1) : 0.5;
    if (share < LABEL_EDGE_SHARE) return 'start';
    if (share > 1 - LABEL_EDGE_SHARE) return 'end';

    return 'middle';
};

type ExtremeLabelProps = {
    viewBox?: { x: number; y: number };
    text: string;
    placement: 'above' | 'below';
    textAnchor: 'start' | 'middle' | 'end';
};

const ExtremeLabel = ({ viewBox, text, placement, textAnchor }: ExtremeLabelProps) => {
    const theme = useTheme();
    if (viewBox === undefined) {
        return null;
    }

    return (
        <text
            x={viewBox.x}
            y={
                placement === 'above'
                    ? viewBox.y - LABEL_GAP
                    : viewBox.y + LABEL_GAP + LABEL_FONT_SIZE
            }
            textAnchor={textAnchor}
            fill={theme.contentTertiary}
            fontSize={LABEL_FONT_SIZE}
        >
            {text}
        </text>
    );
};

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
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const formatPrice = (price: number) =>
        BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(new BigNumber(price)), {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
        }) ?? '';
    const fiatCurrency = useSelector(selectBaseCurrency);
    const shouldAnimateSkeleton = useSelector(selectShouldAnimateLoadingSkeleton);
    const token = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );
    const range = useSelector(selectAssetPriceChartRange);
    const { data: points, isLoading } = useAssetPriceHistoryQuery({
        ticker: {
            symbol: networkSymbol,
            tokenAddress: tokenContract,
            protocols: isErc4626(token) ? ['erc4626'] : undefined,
        },
        fiatCurrency,
        range,
    });
    const extremes = useMemo(() => (points ? getPriceExtremes(points) : undefined), [points]);

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

    if (extremes === undefined) {
        return null;
    }

    return (
        <ChartFrame data-testid="@price-chart/graph">
            <ChartFill>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={points}
                        margin={{ top: LABEL_SPACE, right: 0, bottom: LABEL_SPACE, left: 0 }}
                        accessibilityLayer
                    >
                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            hide
                        />
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <ReferenceLine
                            y={extremes.high.price}
                            stroke={theme.contentTertiary}
                            strokeDasharray="1 4"
                        />
                        <ReferenceDot
                            x={extremes.high.timestamp}
                            y={extremes.high.price}
                            r={0}
                            label={
                                <ExtremeLabel
                                    text={formatPrice(extremes.high.price)}
                                    placement="above"
                                    textAnchor={getLabelAnchor(extremes.highIndex, points.length)}
                                />
                            }
                        />
                        <ReferenceDot
                            x={extremes.low.timestamp}
                            y={extremes.low.price}
                            r={0}
                            label={
                                <ExtremeLabel
                                    text={formatPrice(extremes.low.price)}
                                    placement="below"
                                    textAnchor={getLabelAnchor(extremes.lowIndex, points.length)}
                                />
                            }
                        />
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

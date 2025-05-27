/**
 * currency
 * all
 * */

import { useEffect, useState } from 'react';

import { getUnixTime, isAfter, isBefore, isSameYear } from 'date-fns';
import {
    Area,
    ComposedChart,
    Label,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useTheme } from 'styled-components';

import { useFormatters } from '@suite-common/formatters';

import { GraphTooltip } from './GraphTooltip';
import { PlusMinusDot } from './PlusMinusDot';
import { demoData } from './data';
import { ApiData, MetaData, RawDataItem } from './types';
import {
    calculateMetaData,
    calculateSegments,
    dateFormatter,
    sanitizeCoinData,
    sanitizePortfolioData,
} from './utils';
import { CommonAggregatedHistory, GraphRange } from '../../../../../types/wallet/graph';
import { GraphSkeleton } from '../../GraphSkeleton';

type TransactionsGraphProps = {
    selectedRange: GraphRange;
    portfolioData: CommonAggregatedHistory[];
    localCurrency: string;
};

const getCurrentRange = (selectedRange: GraphRange) => {
    if (selectedRange.label === 'all') {
        const startDate = new Date(2020, 0, 1);
        const endDate = new Date();

        return {
            ...selectedRange,
            startDate,
            endDate,
        };
    }

    return selectedRange;
};

export function ReferenceLabel(props) {
    const { FiatAmountFormatter } = useFormatters();
    const { value, textAnchor, fontSize, viewBox, dy, dx, localCurrency, symbol } = props;
    const x = 15;
    const y = viewBox.y + 3;
    const theme = useTheme();

    return (
        <text
            x={x}
            y={y}
            dy={dy}
            dx={dx}
            fill={theme.textSubdued}
            fontSize={fontSize || 10}
            textAnchor={textAnchor}
        >
            {symbol}{' '}
            <FiatAmountFormatter
                value={value.toFixed()}
                currency={localCurrency}
                minimumFractionDigits={0}
            />
        </text>
    );
}

export const TransactionsGraph = ({
    selectedRange,
    portfolioData,
    localCurrency,
}: TransactionsGraphProps) => {
    const currentRange = getCurrentRange(selectedRange);
    const theme = useTheme();
    const [segments, setSegments] = useState<RawDataItem[][]>([]);
    const [raw, setRaw] = useState<RawDataItem[]>([]);
    const [sanitizedPortfolioData, setSanitizedPortfolioData] = useState<RawDataItem[]>([]);
    const [verticalSegments, setVerticalSegments] = useState<RawDataItem[][]>([]);
    const [ticks, setTicks] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [metaData, setMetaData] = useState<MetaData>({
        min: null,
        max: null,
        average: null,
    });

    const removeData = () => {
        setVerticalSegments([]);
        setTicks([]);
        setRaw([]);
        setSegments([]);
    };

    useEffect(() => {
        setIsLoading(true);
        removeData();

        const fetchMockData = () => {
            const rawData = sanitizeCoinData(demoData, selectedRange);
            const filteredRawData = rawData.filter(
                item =>
                    isBefore(new Date(item.date), currentRange.endDate) &&
                    isAfter(new Date(item.date), currentRange.startDate),
            );
            setRaw(filteredRawData);
        };

        const fetchData = async () => {
            const fromTimestamp = getUnixTime(new Date(currentRange.startDate));
            const toTimestamp = getUnixTime(new Date(currentRange.endDate));

            console.log(
                '___ZZZZZTT',
                `https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart/range?vs_currency=${localCurrency}&from=${fromTimestamp}&to=${toTimestamp}`,
            );
            const response = await fetch(
                `https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart/range?vs_currency=${localCurrency}&from=${fromTimestamp}&to=${toTimestamp}`,
            );
            const fetchedData = (await response.json()) as ApiData;
            setRaw(sanitizeCoinData(fetchedData, selectedRange));
        };

        fetchMockData();
        // fetchData().catch(console.error);
    }, [selectedRange.startDate, selectedRange.endDate, localCurrency]);

    useEffect(() => {
        const { newSegments, newVerticalSegments, filteredTicks } = calculateSegments(raw);

        setSegments(newSegments);
        setVerticalSegments(newVerticalSegments);
        setTicks(filteredTicks);

        setMetaData(calculateMetaData(raw));
        setIsLoading(false);
    }, [raw]);

    useEffect(() => {
        const sanitizedData = sanitizePortfolioData(portfolioData);
        console.log('___P', raw, sanitizedData);
        setSanitizedPortfolioData(sanitizedData);
    }, [portfolioData]);

    if (isLoading) {
        return <GraphSkeleton animate />;
    }

    const shouldShowYearInXAxis =
        raw.length > 1
            ? isSameYear(new Date(raw[0].date), new Date(raw[raw.length - 1].date))
            : true;

    return (
        <>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={raw} margin={{ top: 20, right: 0, left: 70, bottom: 0 }}>
                    <XAxis
                        tick={{ fontSize: 12 }}
                        dataKey="date"
                        allowDuplicatedCategory={false}
                        tickFormatter={date => dateFormatter(date, shouldShowYearInXAxis)}
                        minTickGap={100}
                        tickLine={false}
                        axisLine={false}
                        padding={{ left: 0, right: 0 }}
                        interval="preserveStartEnd"
                        ticks={[...new Set(ticks)]}
                    />
                    <YAxis
                        type="number"
                        domain={['auto', 'auto']}
                        ticks={[]}
                        hide={true}
                        allowDataOverflow
                    />
                    {/*<CartesianGrid strokeDasharray="1 10" />*/}
                    <Tooltip
                        animationDuration={50}
                        cursor={{
                            stroke: theme.backgroundNeutralBold,
                            strokeWidth: 2,
                            strokeDasharray: '3 6',

                            strokeLinejoin: 'round',
                            strokeLinecap: 'round',
                        }}
                        content={<GraphTooltip localCurrency={localCurrency} />}
                    />
                    <defs>
                        {/* vektor jde od (0,0) do (0,200) v uživatelských jednotkách (px) */}
                        <linearGradient
                            id="gradient-area"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="300"
                            gradientUnits="userSpaceOnUse" /* ↔ absolutní souřadnice */
                        >
                            {/* 0   = horní bod vektoru = 200 px NAD spodkem tvaru → plná zelená */}
                            <stop
                                offset="0"
                                stopColor={theme.backgroundSecondaryDefault}
                                stopOpacity="0.2"
                            />

                            {/* 1   = dolní bod vektoru = skutečné dno tvaru    → úplně průhledná */}
                            <stop
                                offset="1"
                                stopColor={theme.backgroundSecondaryDefault}
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                    {/* hlavní křivka */}
                    );
                    {segments.map((segment, index) => (
                        <Area
                            key={`main-${index}`}
                            data={segment}
                            type="linear"
                            dataKey="value"
                            stroke={theme.backgroundPrimaryDefault}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                            legendType={index ? 'none' : undefined}
                            fill="url(#gradient-area)"
                            name={`main-line-${index}`}
                        />
                    ))}
                    {/* samostatná čárkovaná vertikála pro každý skok */}
                    {verticalSegments.map((pair, index) => {
                        const firstPoint = pair[0];
                        const lastPoint = pair[pair.length - 1];
                        // if (nextIndex == null || nextPoint === null) return null;
                        const isPositive = firstPoint.value <= lastPoint.value;

                        return (
                            <Line
                                key={`v-${index}`}
                                data={pair}
                                type="linear"
                                dataKey="value"
                                stroke={
                                    isPositive
                                        ? theme.backgroundSecondaryDefault
                                        : theme.backgroundAlertRedBold
                                }
                                strokeWidth={1.5}
                                strokeDasharray="3 6"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                // dot={false}
                                isAnimationActive={false}
                                legendType="none"
                                dot={<PlusMinusDot />}
                                name={`jump-${index}`}
                            />
                        );
                    })}
                    {/*{sanitizedPortfolioData.map((pair, index) => {*/}
                    {/*    return (*/}
                    {/*        <Line*/}
                    {/*            key={`b-${index}`}*/}
                    {/*            data={pair}*/}
                    {/*            type="linear"*/}
                    {/*            dataKey="value"*/}
                    {/*            stroke={'blue'}*/}
                    {/*            strokeWidth={1.5}*/}
                    {/*            strokeDasharray="3 6"*/}
                    {/*            strokeLinejoin="round"*/}
                    {/*            strokeLinecap="round"*/}
                    {/*            isAnimationActive={false}*/}
                    {/*            legendType="none"*/}
                    {/*            name={`balance-${index}`}*/}
                    {/*        />*/}
                    {/*    );*/}
                    {/*})}*/}
                    {metaData.min && (
                        <ReferenceLine
                            y={metaData.min}
                            stroke={theme.backgroundNeutralSubdued}
                            strokeDasharray="1 2"
                            strokeWidth={1}
                            ifOverflow="extendDomain"
                            label={
                                <ReferenceLabel
                                    symbol="▼"
                                    value={metaData.min}
                                    localCurrency={localCurrency}
                                />
                            }
                        >
                            {/*<Label*/}
                            {/*    value={metaData.min ? `▼ ${Math.round(metaData.min)}` : ''}*/}
                            {/*    position="left"*/}
                            {/*    fill="gray"*/}
                            {/*    fontSize={10}*/}
                            {/*    offset={10}*/}
                            {/*/>*/}
                        </ReferenceLine>
                    )}
                    {metaData.max && (
                        <ReferenceLine
                            y={metaData.max}
                            stroke={theme.backgroundNeutralSubdued}
                            strokeDasharray="1 2"
                            strokeWidth={1}
                            ifOverflow="extendDomain"
                            label={
                                <ReferenceLabel
                                    symbol="▲"
                                    value={metaData.max}
                                    localCurrency={localCurrency}
                                />
                            }
                        >
                            {/*<Label*/}
                            {/*    value={metaData.max ? `▲ ${Math.round(metaData.max)}` : ''}*/}
                            {/*    position="left"*/}
                            {/*    fill="gray"*/}
                            {/*    fontSize={10}*/}
                            {/*    offset={10}*/}
                            {/*/>*/}
                        </ReferenceLine>
                    )}
                    {metaData.average && (
                        <ReferenceLine
                            y={metaData.average}
                            stroke={theme.backgroundNeutralSubdued}
                            strokeDasharray="1 2"
                            strokeWidth={1}
                            ifOverflow="extendDomain"
                            label={
                                <ReferenceLabel
                                    symbol="⌀"
                                    value={metaData.average}
                                    localCurrency={localCurrency}
                                />
                            }
                        >
                            {/*<Label*/}
                            {/*    label={<CustomLabel />}*/}
                            {/*    // value={metaData.average ? `⌀ ${Math.round(metaData.average)}` : ''}*/}
                            {/*    position="left"*/}
                            {/*    fill="gray"*/}
                            {/*    fontSize={10}*/}
                            {/*    offset={10}*/}
                            {/*/>*/}
                        </ReferenceLine>
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </>
    );
};

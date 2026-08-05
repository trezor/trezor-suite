import { memo, useState } from 'react';

import { Bar, CartesianGrid, Cell, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import styled, { useTheme } from 'styled-components';

import { typography, zIndices } from '@trezor/theme';

import { GraphSkeleton } from 'src/components/suite/graph/GraphSkeleton';
import type { TransactionsGraphProps } from 'src/components/suite/graph/types';
import { calcFakeGraphDataForTimestamps, calcXDomain, calcYDomain } from 'src/utils/wallet/graph';

import { GraphBar } from './GraphBar';
import { GraphResponsiveContainer } from './GraphResponsiveContainer';
import { GraphTooltipAccount } from './GraphTooltipAccount';
import { GraphTooltipDashboard } from './GraphTooltipDashboard';
import { GraphXAxisTick } from './GraphXAxisTick';
import { GraphYAxisTick } from './GraphYAxisTick';
import { useTransactionGraphUpdater } from './hooks/useTransactionGraphUpdater';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    ${typography['body-xs']}
    white-space: nowrap;

    /* little hack to remove first and last horizontal line from cartesian grid (lines that wrap the area of the chart) */

    .recharts-wrapper .recharts-cartesian-grid-horizontal line:first-child,
    .recharts-wrapper .recharts-cartesian-grid-horizontal line:last-child {
        stroke-opacity: 0;
    }

    /* hides circle dot in case only one month is displayed */

    .recharts-dot.recharts-line-dot {
        display: none;
    }
`;

const Description = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: ${({ theme }) => theme.contentSecondary};
    flex: 1;
`;

export const TransactionsGraph = memo(
    ({
        account,
        balanceValueFn,
        data,
        isLoading,
        localCurrency,
        minMaxValues,
        onRefresh,
        receivedValueFn,
        selectedRange,
        sentValueFn,
        variant,
        xTicks,
    }: TransactionsGraphProps) => {
        const [maxYTickWidth, setMaxYTickWidth] = useState(20);
        const [hovered, setHovered] = useState(-1);

        const theme = useTheme();

        useTransactionGraphUpdater({
            accountKey: account?.key,
            onRequestGraphUpdate: onRefresh,
        });

        const yDomain = calcYDomain(minMaxValues, account?.formattedBalance);

        const setWidth = (n: number) => {
            setMaxYTickWidth(prevValue => (prevValue > n ? prevValue : n));
        };

        const rightMargin = Math.max(0, maxYTickWidth - 50) + 10; // 50 is the default spacing

        // calculate fake data for full interval (eg. 1 year) even for ticks/timestamps without txs
        const extendedDataForInterval =
            variant === 'one-asset'
                ? calcFakeGraphDataForTimestamps(xTicks, data, account.formattedBalance)
                : calcFakeGraphDataForTimestamps(xTicks, data);

        const isBarColored = (index: number) => [-1, index].includes(hovered);

        const tooltipContentProps = {
            selectedRange,
            localCurrency,
            extendedDataForInterval,
            onShow: (index: number) => setHovered(index),
        };

        // While there is data to show, the graph stays visible during a refetch instead of falling
        // back to the skeleton. An empty interval (e.g. a day without transactions) is not a loading
        // state — it renders as a graph with no bars, so the axes and the balance stay readable.
        const isSkeletonShown = isLoading && !data?.length;

        return (
            <Wrapper>
                <Description>
                    {isSkeletonShown ? (
                        <GraphSkeleton animate />
                    ) : (
                        <GraphResponsiveContainer height="100%" width="100%">
                            <ComposedChart
                                data={extendedDataForInterval}
                                barGap={0}
                                // stackOffset="sign"
                                margin={{
                                    top: 10,
                                    bottom: 30,
                                    right: rightMargin,
                                    left: 20,
                                }}
                                onMouseLeave={() => setHovered(-1)}
                            >
                                <CartesianGrid vertical={false} stroke={theme.borderNeutral} />

                                <XAxis
                                    // xAxisId="primary"
                                    dataKey="time"
                                    type="number"
                                    domain={calcXDomain(xTicks, data, selectedRange)}
                                    // width={10}
                                    stroke={theme.elementBorderFieldFocused}
                                    interval="preserveEnd"
                                    tick={<GraphXAxisTick selectedRange={selectedRange} />}
                                    ticks={xTicks}
                                    tickLine={false}
                                    onMouseEnter={() => setHovered(-1)}
                                />

                                <YAxis
                                    type="number"
                                    orientation="right"
                                    scale="linear"
                                    domain={yDomain}
                                    allowDataOverflow={false}
                                    stroke="transparent"
                                    tick={
                                        variant === 'one-asset' ? (
                                            <GraphYAxisTick
                                                symbol={account.symbol}
                                                setWidth={setWidth}
                                            />
                                        ) : (
                                            <GraphYAxisTick
                                                localCurrency={localCurrency}
                                                setWidth={setWidth}
                                            />
                                        )
                                    }
                                    onMouseEnter={() => setHovered(-1)}
                                />
                                <Tooltip
                                    position={{ y: 0, x: 0 }}
                                    wrapperStyle={{ zIndex: zIndices.tooltip }}
                                    cursor={{
                                        stroke: theme.elementFillNeutralBold,
                                        strokeWidth: 1,
                                    }}
                                    content={
                                        variant === 'one-asset' ? (
                                            <GraphTooltipAccount
                                                symbol={account.symbol}
                                                sentValueFn={sentValueFn}
                                                receivedValueFn={receivedValueFn}
                                                balanceValueFn={balanceValueFn}
                                                {...tooltipContentProps}
                                            />
                                        ) : (
                                            <GraphTooltipDashboard
                                                sentValueFn={sentValueFn}
                                                receivedValueFn={receivedValueFn}
                                                {...tooltipContentProps}
                                            />
                                        )
                                    }
                                />

                                {variant === 'one-asset' && (
                                    <Line
                                        type="linear"
                                        dataKey={(data: any) => Number(balanceValueFn(data))}
                                        stroke={theme.borderWarning}
                                        dot={false}
                                        activeDot={false}
                                    />
                                )}

                                <defs>
                                    <filter id="shadow" x="-2" y="-10" width="50" height="50">
                                        <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                                        <feOffset dx="0" dy="-5" result="offsetblur" />
                                        <feFlood floodColor="rgb(0,0,0)" floodOpacity="0.1" />
                                        <feComposite in2="offsetblur" operator="in" />
                                        <feMerge>
                                            <feMergeNode in="offsetBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <Bar
                                    dataKey={(data: any) => Number(receivedValueFn(data) ?? 0)}
                                    barSize={selectedRange.label === 'all' ? 8 : 16}
                                    shape={<GraphBar variant="received" />}
                                >
                                    {extendedDataForInterval.map((entry, index) => (
                                        <Cell
                                            key={`cell-${entry}`}
                                            filter={isBarColored(index) ? 'url(#shadow)' : ''}
                                            fill={
                                                isBarColored(index) ? theme.borderBrand : '#aeaeae'
                                            }
                                        />
                                    ))}
                                </Bar>
                                <Bar
                                    dataKey={(data: any) => Number(sentValueFn(data) ?? 0)}
                                    barSize={selectedRange.label === 'all' ? 8 : 16}
                                    shape={<GraphBar variant="sent" />}
                                >
                                    {extendedDataForInterval.map((entry, index) => (
                                        <Cell
                                            key={`cell-${entry}`}
                                            filter={isBarColored(index) ? 'url(#shadow)' : ''}
                                            fill={
                                                isBarColored(index)
                                                    ? theme.borderCritical
                                                    : '#dfdfdf'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </GraphResponsiveContainer>
                    )}
                </Description>
            </Wrapper>
        );
    },
);

TransactionsGraph.displayName = 'TransactionsGraph';

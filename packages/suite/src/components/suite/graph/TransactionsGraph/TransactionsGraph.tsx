import { memo, useEffect, useState } from 'react';

import { Bar, CartesianGrid, Cell, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import styled, { useTheme } from 'styled-components';

import { selectAccountTransactionsWithNulls } from '@suite-common/wallet-core';
import { isPending } from '@suite-common/wallet-utils';
import { Icon } from '@trezor/components';
import { typography, zIndices } from '@trezor/theme';

import { GraphRangeSelector } from 'src/components/suite/graph/GraphRangeSelector';
import { GraphSkeleton } from 'src/components/suite/graph/GraphSkeleton';
import type { TransactionsGraphProps } from 'src/components/suite/graph/types';
import { useGraph, useSelector } from 'src/hooks/suite';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';
import { calcFakeGraphDataForTimestamps, calcXDomain, calcYDomain } from 'src/utils/wallet/graph';

import { GraphBar } from './GraphBar';
import { GraphResponsiveContainer } from './GraphResponsiveContainer';
import { GraphTooltipAccount } from './GraphTooltipAccount';
import { GraphTooltipDashboard } from './GraphTooltipDashboard';
import { GraphXAxisTick } from './GraphXAxisTick';
import { GraphYAxisTick } from './GraphYAxisTick';

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

const Toolbar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Description = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: ${({ theme }) => theme.textSubdued};
    flex: 1;
`;

const emptyList: ReturnType<typeof selectAccountTransactionsWithNulls>[] = [];
const useTransactionGraphUpdater = ({
    onRequestGraphUpdate,
    account,
}: {
    onRequestGraphUpdate: (abortController: AbortController) => Promise<unknown> | undefined;
    account: Account | undefined;
}) => {
    const [currentPromise, setCurrentPromise] = useState<{
        promiseId: string;
        promise: Promise<unknown>;
        abortController: AbortController;
    } | null>(null);

    const allTransactions = useSelector(state =>
        account ? selectAccountTransactionsWithNulls(state, account.key) : emptyList,
    );

    const newestTransactions = allTransactions
        .slice(0, 3)
        .flat()
        .filter((tx): tx is WalletAccountTransaction =>
            Boolean(Boolean(tx) && tx && !isPending(tx)),
        );

    const promiseId = newestTransactions.map(tx => tx.txid).join('-');

    useEffect(() => {
        if (promiseId !== currentPromise?.promiseId && account) {
            const nextAbortController = new AbortController();

            currentPromise?.abortController.abort();

            setCurrentPromise({
                promiseId,
                abortController: nextAbortController,
                promise: Promise.resolve()
                    .then(() =>
                        currentPromise?.promise?.then(
                            result => result,
                            _ => {
                                // NOTE: swallow this error as we want to continue on with the next promise
                            },
                        ),
                    )
                    .then(() => {
                        nextAbortController.signal.throwIfAborted();

                        return Promise.resolve(onRequestGraphUpdate(nextAbortController));
                    }),
            });
        }
    }, [
        account,
        currentPromise?.abortController,
        currentPromise?.promise,
        currentPromise?.promiseId,
        promiseId,
        onRequestGraphUpdate,
    ]);
};

export const TransactionsGraph = memo(
    ({
        account,
        balanceValueFn,
        data,
        hideToolbar,
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

        const theme = useTheme();
        const { selectedView } = useGraph();
        const yDomain = calcYDomain(
            variant === 'all-assets' ? 'fiat' : 'crypto',
            selectedView,
            minMaxValues,
            account?.formattedBalance,
        );

        const setWidth = (n: number) => {
            setMaxYTickWidth(prevValue => (prevValue > n ? prevValue : n));
        };

        const rightMargin = Math.max(0, maxYTickWidth - 50) + 10; // 50 is the default spacing

        // calculate fake data for full interval (eg. 1 year) even for ticks/timestamps without txs
        const extendedDataForInterval =
            variant === 'one-asset'
                ? calcFakeGraphDataForTimestamps(xTicks, data, account.formattedBalance)
                : calcFakeGraphDataForTimestamps(xTicks, data);

        const hoveredIndex = -1;
        const [hovered, setHovered] = useState(hoveredIndex);
        const isBarColored = (index: number) => [-1, index].includes(hovered);

        const tooltipContentProps = {
            selectedRange,
            localCurrency,
            extendedDataForInterval,
            onShow: (index: number) => setHovered(index),
        };

        useTransactionGraphUpdater({
            onRequestGraphUpdate: abortController => onRefresh?.(abortController),
            account,
        });

        return (
            <Wrapper>
                {!hideToolbar && (
                    <Toolbar>
                        <GraphRangeSelector
                            placement={{
                                position: 'bottom',
                                alignment: 'start',
                            }}
                        />
                        {onRefresh && <Icon size={14} name="repeat" onClick={onRefresh} />}
                    </Toolbar>
                )}
                <Description>
                    {isLoading && <GraphSkeleton animate />}

                    {!isLoading && data && (
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
                                <CartesianGrid vertical={false} stroke={theme.borderDashed} />

                                <XAxis
                                    // xAxisId="primary"
                                    dataKey="time"
                                    type="number"
                                    domain={calcXDomain(xTicks, data, selectedRange)}
                                    // width={10}
                                    stroke={theme.borderFocus}
                                    interval="preserveEnd"
                                    tick={<GraphXAxisTick selectedRange={selectedRange} />}
                                    ticks={xTicks}
                                    tickLine={false}
                                    onMouseEnter={() => setHovered(-1)}
                                />

                                <YAxis
                                    type="number"
                                    orientation="right"
                                    scale={selectedView}
                                    domain={yDomain}
                                    allowDataOverflow={selectedView === 'log'}
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
                                        stroke: theme.backgroundNeutralSubdued,
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
                                        dataKey={(data: any) =>
                                            selectedView === 'log'
                                                ? Number(balanceValueFn(data)) || yDomain[0]
                                                : Number(balanceValueFn(data))
                                        }
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

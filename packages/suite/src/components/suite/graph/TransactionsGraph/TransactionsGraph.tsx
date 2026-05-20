import { memo, useEffect, useState } from 'react';

import { Bar, CartesianGrid, Cell, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import styled, { useTheme } from 'styled-components';

import { selectAccountTransactionsWithNulls } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';
import { typography, zIndices } from '@trezor/theme';

import { GraphSkeleton } from 'src/components/suite/graph/GraphSkeleton';
import { type TransactionsGraphProps } from 'src/components/suite/graph/types';
import { useSelector } from 'src/hooks/suite';
import { type WalletAccountTransaction } from 'src/types/wallet';
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

    .recharts-wrapper .recharts-cartesian-grid-horizontal line:first-child,
    .recharts-wrapper .recharts-cartesian-grid-horizontal line:last-child {
        stroke-opacity: 0;
    }

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

const emptyList: ReturnType<typeof selectAccountTransactionsWithNulls>[] = [];

const useTransactionGraphUpdater = ({
    onRequestGraphUpdate,
    accountKey,
}: {
    onRequestGraphUpdate: (abortController: AbortController) => Promise<unknown> | undefined;
    accountKey?: AccountKey;
}) => {
    const [currentPromise, setCurrentPromise] = useState<{
        abortController: AbortController;
        promise: Promise<unknown>;
        promiseId: string;
    } | null>(null);

    const allTransactions = useSelector(state =>
        accountKey ? selectAccountTransactionsWithNulls(state, accountKey) : emptyList,
    );

    const newestTransactions = allTransactions
        .slice(0, 3)
        .flat()
        .filter((tx): tx is WalletAccountTransaction => Boolean(tx) && !isPending(tx));

    const promiseId = newestTransactions.map(tx => tx.txid).join('-');

    useEffect(() => {
        if (!accountKey || promiseId === currentPromise?.promiseId) {
            return;
        }

        const nextAbortController = new AbortController();
        currentPromise?.abortController.abort();

        setCurrentPromise({
            promiseId,
            abortController: nextAbortController,
            promise: Promise.resolve()
                .then(() =>
                    currentPromise?.promise?.then(
                        result => result,
                        () => undefined,
                    ),
                )
                .then(() => {
                    nextAbortController.signal.throwIfAborted();

                    return Promise.resolve(onRequestGraphUpdate(nextAbortController));
                }),
        });
    }, [accountKey, currentPromise, onRequestGraphUpdate, promiseId]);
};

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

        const theme = useTheme();
        const yDomain = calcYDomain(
            variant === 'all-assets' ? 'fiat' : 'crypto',
            'linear',
            minMaxValues,
            account?.formattedBalance,
        );

        const rightMargin = Math.max(0, maxYTickWidth - 50) + 10;
        const extendedDataForInterval =
            variant === 'one-asset'
                ? calcFakeGraphDataForTimestamps(xTicks, data, account.formattedBalance)
                : calcFakeGraphDataForTimestamps(xTicks, data);

        const hoveredIndex = -1;
        const [hovered, setHovered] = useState(hoveredIndex);
        const isBarColored = (index: number) => [-1, index].includes(hovered);

        const typedReceivedValueFn = receivedValueFn as (
            sourceData: (typeof extendedDataForInterval)[number],
        ) => string | number | undefined;
        const typedSentValueFn = sentValueFn as (
            sourceData: (typeof extendedDataForInterval)[number],
        ) => string | number | undefined;
        const typedBalanceValueFn = balanceValueFn as (
            sourceData: (typeof extendedDataForInterval)[number],
        ) => string | number | undefined;

        useTransactionGraphUpdater({
            onRequestGraphUpdate: abortController => onRefresh?.(abortController),
            accountKey: account?.key,
        });

        return (
            <Wrapper>
                <Description>
                    {isLoading && <GraphSkeleton animate />}

                    {!isLoading && data && (
                        <GraphResponsiveContainer height="100%" width="100%">
                            <ComposedChart
                                data={extendedDataForInterval}
                                barGap={0}
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
                                    dataKey="time"
                                    type="number"
                                    domain={calcXDomain(xTicks, data, selectedRange)}
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
                                                setWidth={width => setMaxYTickWidth(width)}
                                            />
                                        ) : (
                                            <GraphYAxisTick
                                                localCurrency={localCurrency}
                                                setWidth={width => setMaxYTickWidth(width)}
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
                                                selectedRange={selectedRange}
                                                localCurrency={localCurrency}
                                                extendedDataForInterval={extendedDataForInterval}
                                                onShow={setHovered}
                                            />
                                        ) : (
                                            <GraphTooltipDashboard
                                                sentValueFn={sentValueFn}
                                                receivedValueFn={receivedValueFn}
                                                selectedRange={selectedRange}
                                                localCurrency={localCurrency}
                                                extendedDataForInterval={extendedDataForInterval}
                                                onShow={setHovered}
                                            />
                                        )
                                    }
                                />

                                {variant === 'one-asset' && (
                                    <Line
                                        type="linear"
                                        dataKey={dataPoint =>
                                            Number(typedBalanceValueFn(dataPoint) ?? 0)
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
                                    dataKey={dataPoint =>
                                        Number(typedReceivedValueFn(dataPoint) ?? 0)
                                    }
                                    barSize={selectedRange.label === 'all' ? 8 : 16}
                                    shape={<GraphBar />}
                                >
                                    {extendedDataForInterval.map((entry, index) => (
                                        <Cell
                                            key={`${entry.time}-received`}
                                            filter={isBarColored(index) ? 'url(#shadow)' : ''}
                                            fill={
                                                isBarColored(index) ? theme.borderBrand : '#aeaeae'
                                            }
                                        />
                                    ))}
                                </Bar>
                                <Bar
                                    dataKey={dataPoint => Number(typedSentValueFn(dataPoint) ?? 0)}
                                    barSize={selectedRange.label === 'all' ? 8 : 16}
                                    shape={<GraphBar />}
                                >
                                    {extendedDataForInterval.map((entry, index) => (
                                        <Cell
                                            key={`${entry.time}-sent`}
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

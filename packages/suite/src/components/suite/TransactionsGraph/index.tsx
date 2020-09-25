import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, variables, Loader, Icon } from '@trezor/components';
import {
    GraphRange,
    AggregatedAccountHistory,
    AggregatedDashboardHistory,
} from '@wallet-types/graph';
import { ComposedChart, Tooltip, Bar, YAxis, XAxis, Line, CartesianGrid } from 'recharts';
import { useGraph } from '@suite-hooks';
import { calcYDomain, calcXDomain, calcFakeGraphDataForTimestamps } from '@wallet-utils/graphUtils';
import { Account } from '@wallet-types';

import RangeSelector from './components/RangeSelector';
import CustomResponsiveContainer from './components/CustomResponsiveContainer';
import CustomXAxisTick from './components/CustomXAxisTick';
import CustomYAxisTick from './components/CustomYAxisTick';
import CustomBar from './components/CustomBar';
import CustomTooltipDashboard from './components/CustomTooltipDashboard';
import CustomTooltipAccount from './components/CustomTooltipAccount';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    font-size: ${variables.FONT_SIZE.TINY};
    white-space: nowrap;

    /* little hack to remove first and last horizontal line from cartesian grid (lines that wrap the area of the chart) */
    .recharts-wrapper .recharts-cartesian-grid-horizontal line:first-child,
    .recharts-wrapper .recharts-cartesian-grid-horizontal line:last-child {
        stroke-opacity: 0;
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
    color: ${colors.BLACK50};
    flex: 1;
`;

const RefreshIcon = styled(Icon)`
    cursor: pointer;
`;

interface CommonProps {
    isLoading?: boolean;
    selectedRange: GraphRange;
    xTicks: number[];
    localCurrency: string;
    minMaxValues: [number, number];
    hideToolbar?: boolean;
    onRefresh?: () => void;
}
export interface CryptoGraphProps extends CommonProps {
    variant: 'one-asset';
    account: Account;
    data: AggregatedAccountHistory[];
    receivedValueFn: (data: AggregatedAccountHistory) => string | undefined;
    sentValueFn: (data: AggregatedAccountHistory) => string | undefined;
    balanceValueFn: (data: AggregatedAccountHistory) => string | undefined;
}

export interface FiatGraphProps extends CommonProps {
    variant: 'all-assets';
    data: AggregatedDashboardHistory[];
    receivedValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    sentValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    balanceValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    account?: never;
}

export type Props = CryptoGraphProps | FiatGraphProps;

const TransactionsGraph = React.memo((props: Props) => {
    const { isLoading, data, selectedRange, xTicks } = props;
    const { selectedView } = useGraph();
    const [maxYTickWidth, setMaxYTickWidth] = useState(20);
    const yDomain = calcYDomain(
        props.variant === 'all-assets' ? 'fiat' : 'crypto',
        selectedView,
        props.minMaxValues,
        props.account?.formattedBalance,
    );

    const setWidth = (n: number) => {
        setMaxYTickWidth(prevValue => (prevValue > n ? prevValue : n));
    };

    const rightMargin = Math.max(0, maxYTickWidth - 50) + 10; // 50 is the default spacing

    // calculate fake data for full interval (eg. 1 year) even for ticks/timestamps without txs
    const extendedDataForInterval =
        props.variant === 'one-asset'
            ? calcFakeGraphDataForTimestamps(xTicks, data, props.account.formattedBalance)
            : calcFakeGraphDataForTimestamps(xTicks, data);

    return (
        <Wrapper>
            {!props.hideToolbar && (
                <Toolbar>
                    <RangeSelector />
                    {props.onRefresh && (
                        <RefreshIcon
                            size={14}
                            icon="REFRESH"
                            hoverColor={colors.BLACK0}
                            onClick={() => (props.onRefresh ? props.onRefresh() : undefined)}
                        />
                    )}
                </Toolbar>
            )}
            <Description>
                {isLoading && <Loader size={24} />}
                {!isLoading && data && (
                    <CustomResponsiveContainer height="100%" width="100%">
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
                        >
                            <CartesianGrid vertical={false} stroke={colors.NEUE_BG_GRAY} />

                            <XAxis
                                // xAxisId="primary"
                                dataKey="time"
                                type="number"
                                domain={calcXDomain(xTicks, data, selectedRange)}
                                // width={10}
                                stroke={colors.NEUE_BG_GRAY}
                                interval="preserveEnd"
                                tick={<CustomXAxisTick selectedRange={selectedRange} />}
                                ticks={xTicks}
                                tickLine={false}
                            />

                            <YAxis
                                type="number"
                                orientation="right"
                                scale={selectedView}
                                domain={yDomain}
                                allowDataOverflow={selectedView === 'log'}
                                stroke={colors.NEUE_BG_GRAY}
                                tick={
                                    props.variant === 'one-asset' ? (
                                        <CustomYAxisTick
                                            symbol={props.account.symbol}
                                            setWidth={setWidth}
                                        />
                                    ) : (
                                        <CustomYAxisTick
                                            localCurrency={props.localCurrency}
                                            setWidth={setWidth}
                                        />
                                    )
                                }
                            />
                            <Tooltip
                                cursor={{ stroke: '#2b2c4f', strokeWidth: 1 }}
                                content={
                                    props.variant === 'one-asset' ? (
                                        <CustomTooltipAccount
                                            selectedRange={selectedRange}
                                            symbol={props.account.symbol}
                                            localCurrency={props.localCurrency}
                                            sentValueFn={props.sentValueFn}
                                            receivedValueFn={props.receivedValueFn}
                                            balanceValueFn={props.balanceValueFn}
                                        />
                                    ) : (
                                        <CustomTooltipDashboard
                                            selectedRange={selectedRange}
                                            localCurrency={props.localCurrency}
                                            sentValueFn={props.sentValueFn}
                                            receivedValueFn={props.receivedValueFn}
                                            // balanceValueFn={props.balanceValueFn}
                                        />
                                    )
                                }
                            />

                            {props.variant === 'one-asset' && (
                                <Line
                                    type="linear"
                                    dataKey={(data: any) => {
                                        return selectedView === 'log'
                                            ? Number(props.balanceValueFn(data)) || yDomain[0]
                                            : Number(props.balanceValueFn(data));
                                    }}
                                    stroke={colors.NEUE_TYPE_ORANGE}
                                    dot={false}
                                    activeDot={false}
                                />
                            )}
                            <defs>
                                <linearGradient
                                    id="greenGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="100%"
                                    spreadMethod="reflect"
                                >
                                    <stop offset="0" stopColor={colors.NEUE_BG_GREEN} />
                                    <stop offset="1" stopColor="#4cbc26" />
                                </linearGradient>
                            </defs>
                            <defs>
                                <linearGradient
                                    id="redGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="100%"
                                    spreadMethod="reflect"
                                >
                                    <stop offset="0" stopColor="#d15b5b" />
                                    <stop offset="1" stopColor="#e75f5f" />
                                </linearGradient>
                            </defs>

                            {/* shadow position is incorrect if there are too many bars, forcing them to be smaller than specified barSize */}
                            {/* <defs>
                                <filter id="shadow" x="-20%" y="-20%" width="200%" height="200%">
                                    <feDropShadow
                                        stdDeviation="5"
                                        floodColor="rgba(0, 0, 0, 0.1)"
                                    />
                                </filter>
                            </defs> */}

                            <Bar
                                dataKey={(data: any) => Number(props.receivedValueFn(data) ?? 0)}
                                // stackId="stack"
                                fill="url(#greenGradient)"
                                // filter="url(#shadow)"
                                barSize={selectedRange.label === 'all' ? 8 : 16}
                                shape={<CustomBar variant="received" />}
                            />
                            <Bar
                                dataKey={(data: any) => Number(props.sentValueFn(data) ?? 0)}
                                // stackId="stack"
                                fill="url(#redGradient)"
                                // filter="url(#shadow)"
                                barSize={selectedRange.label === 'all' ? 8 : 16}
                                shape={<CustomBar variant="sent" />}
                            />
                        </ComposedChart>
                    </CustomResponsiveContainer>
                )}
            </Description>
        </Wrapper>
    );
});

export default TransactionsGraph;

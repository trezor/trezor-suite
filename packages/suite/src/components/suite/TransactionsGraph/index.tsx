import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { colors, variables, Loader, Icon } from '@trezor/components';
import {
    GraphRange,
    AggregatedAccountHistory,
    AggregatedDashboardHistory,
} from '@wallet-types/graph';
import { ComposedChart, Tooltip, Bar, YAxis, XAxis, Line, CartesianGrid } from 'recharts';
import { useLayoutSize } from '@suite-hooks';
import { calcYDomain, calcFakeGraphDataForTimestamps } from '@wallet-utils/graphUtils';
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

const NoTransactionsMessageWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;
const DescriptionHeading = styled.div`
    text-align: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-bottom: 8px;
`;

const RefreshIcon = styled(Icon)`
    cursor: pointer;
`;

interface CommonProps {
    isLoading?: boolean;
    selectedRange: GraphRange;
    xTicks: number[];
    localCurrency: string;
    maxValue?: number;
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
    const [maxYTickWidth, setMaxYTickWidth] = useState(20);
    const { isMobileLayout } = useLayoutSize();

    const setWidth = (n: number) => {
        setMaxYTickWidth(prevValue => (prevValue > n ? prevValue : n));
    };

    const xAxisPadding =
        selectedRange.label === 'year' || selectedRange.label === 'all'
            ? 3600 * 24 * 14
            : 3600 * 12; // 14 days for year/all range, 12 hours otherwise

    const rightMargin = Math.max(0, maxYTickWidth - 50) + 10; // 50 is the default spacing

    // calculate fake data for full interval (eg. 1 year) even for ticks/timestamps without txs
    const extendedDataForInterval =
        props.variant === 'one-asset' ? calcFakeGraphDataForTimestamps(xTicks, data) : null;

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
                {!isLoading && data && data.length === 0 && (
                    <NoTransactionsMessageWrapper>
                        <DescriptionHeading>
                            <Translation id="TR_NO_TRANSACTIONS_TO_SHOW" />
                        </DescriptionHeading>
                        <Translation
                            id="TR_NO_TRANSACTIONS_TO_SHOW_SUB"
                            values={{ newLine: <br /> }}
                        />
                    </NoTransactionsMessageWrapper>
                )}
                {!isLoading && data && data.length > 0 && (
                    <CustomResponsiveContainer height="100%" width="100%">
                        <ComposedChart
                            data={data}
                            // stackOffset="sign"
                            margin={{
                                top: 10,
                                bottom: 30,
                                right: rightMargin,
                                left: 10,
                            }}
                        >
                            <CartesianGrid vertical={false} stroke={colors.NEUE_BG_GRAY} />

                            <XAxis
                                // xAxisId="primary"
                                dataKey="time"
                                type="number"
                                domain={[
                                    xTicks[0] - xAxisPadding,
                                    xTicks[xTicks.length - 1] + xAxisPadding,
                                ]}
                                // width={10}
                                stroke={colors.NEUE_BG_GRAY}
                                interval={
                                    isMobileLayout ||
                                    (props.selectedRange.label === 'all' && xTicks.length > 24)
                                        ? 'preserveStartEnd'
                                        : 0
                                }
                                tick={<CustomXAxisTick selectedRange={selectedRange} />}
                                ticks={xTicks}
                                tickLine={false}
                            />
                            {/* <XAxis
                                xAxisId="secondary"
                                dataKey="time"
                                type="number"
                                domain={[
                                    xTicks[0] - xAxisPadding,
                                    xTicks[xTicks.length - 1] + xAxisPadding,
                                ]}
                                // width={10}
                                stroke={colors.NEUE_BG_GRAY}
                                interval={
                                    isMobileLayout || props.selectedRange.label === 'all'
                                        ? 'preserveStartEnd'
                                        : 0
                                }
                                tick={<CustomXAxisTick selectedRange={selectedRange} />}
                                ticks={xTicks}
                                tickLine={false}
                                hide
                            /> */}
                            <YAxis
                                type="number"
                                orientation="right"
                                scale="linear"
                                domain={calcYDomain(props.maxValue)}
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
                                        />
                                    ) : (
                                        <CustomTooltipDashboard
                                            selectedRange={selectedRange}
                                            localCurrency={props.localCurrency}
                                            sentValueFn={props.sentValueFn}
                                            receivedValueFn={props.receivedValueFn}
                                            balanceValueFn={props.balanceValueFn}
                                        />
                                    )
                                }
                            />

                            {/* <ReferenceLine y={0} stroke={colors.BLACK80} /> */}
                            {/* {props.variant === 'one-asset' && ( */}
                            {/* // probably doesn't make much sense on dashboard */}
                            <Line
                                type="linear"
                                dataKey={(data: any) => Number(props.balanceValueFn(data))}
                                stroke={colors.NEUE_TYPE_ORANGE}
                                data={
                                    selectedRange.label === 'all' || props.variant === 'all-assets'
                                        ? data
                                        : extendedDataForInterval ?? undefined
                                }
                                // dot={false}
                            />
                            {/* )} */}
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

                            <Bar
                                dataKey={(data: any) => Number(props.receivedValueFn(data))}
                                // stackId="stack"
                                fill="url(#greenGradient)"
                                barSize={selectedRange.label === 'all' ? 8 : 16}
                                shape={<CustomBar variant="received" />}
                                // xAxisId="primary"
                            />
                            <Bar
                                dataKey={(data: any) => Number(props.sentValueFn(data))}
                                // stackId="stack"
                                fill="url(#redGradient)"
                                barSize={selectedRange.label === 'all' ? 8 : 16}
                                shape={<CustomBar variant="sent" />}
                                // xAxisId="primary"
                            />
                        </ComposedChart>
                    </CustomResponsiveContainer>
                )}
            </Description>
        </Wrapper>
    );
});

export default TransactionsGraph;

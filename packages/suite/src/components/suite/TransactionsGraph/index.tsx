import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { colors, variables, Loader, Icon } from '@trezor/components';
import { Account } from '@wallet-types';
import {
    GraphRange,
    AggregatedAccountHistory,
    AggregatedDashboardHistory,
} from '@wallet-types/fiatRates';
import { BarChart, Tooltip, Bar, ReferenceLine, YAxis, XAxis } from 'recharts';
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
    maxValue?: number;
    localCurrency: string;
    onSelectedRange: (range: GraphRange) => void;
    onRefresh?: () => void;
}
export interface CryptoGraphProps extends CommonProps {
    variant: 'one-asset';
    account: Account;
    data: AggregatedAccountHistory[] | null;
    receivedValueFn: (data: AggregatedAccountHistory) => string | undefined;
    sentValueFn: (data: AggregatedAccountHistory) => string | undefined;
}

export interface FiatGraphProps extends CommonProps {
    variant: 'all-assets';
    data: AggregatedDashboardHistory[] | null;
    receivedValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    sentValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    account?: never;
}

export type Props = CryptoGraphProps | FiatGraphProps;

const TransactionsGraph = React.memo((props: Props) => {
    const { data, isLoading, selectedRange, xTicks } = props;

    const [maxYTickWidth, setMaxYTickWidth] = useState(20);

    const setWidth = (n: number) => {
        setMaxYTickWidth(prevValue => (prevValue > n ? prevValue : n));
    };

    const xAxisPadding =
        selectedRange.label === 'year' || selectedRange.label === 'all'
            ? 3600 * 24 * 14
            : 3600 * 12; // 14 days for year/all range, 12 hours otherwise

    const rightMargin = Math.max(0, maxYTickWidth - 50) + 10; // 50 is the default spacing

    return (
        <Wrapper>
            <Toolbar>
                <RangeSelector
                    selectedRange={selectedRange}
                    onSelectedRange={props.onSelectedRange}
                />
                {props.onRefresh && (
                    <RefreshIcon
                        size={14}
                        icon="REFRESH"
                        hoverColor={colors.BLACK0}
                        onClick={() => (props.onRefresh ? props.onRefresh() : undefined)}
                    />
                )}
            </Toolbar>
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
                    <CustomResponsiveContainer height="100%" width="99%">
                        <BarChart
                            data={data}
                            stackOffset="sign"
                            margin={{
                                top: 10,
                                bottom: 30,
                                right: rightMargin,
                                left: 10,
                            }}
                        >
                            <XAxis
                                dataKey="time"
                                type="number"
                                domain={[
                                    xTicks[0] - xAxisPadding,
                                    xTicks[xTicks.length - 1] + xAxisPadding,
                                ]}
                                // width={10}
                                stroke={colors.BLACK80}
                                interval={0}
                                tick={<CustomXAxisTick selectedRange={selectedRange} />}
                                ticks={xTicks}
                            />
                            <YAxis
                                type="number"
                                orientation="right"
                                scale="linear"
                                domain={
                                    props.maxValue
                                        ? [props.maxValue * -1.2, props.maxValue * 1.2]
                                        : undefined
                                }
                                stroke={colors.BLACK80}
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
                                        />
                                    )
                                }
                            />
                            <ReferenceLine y={0} stroke={colors.BLACK80} />
                            <Bar
                                dataKey={(data: any) => -1 * Number(props.sentValueFn(data))}
                                stackId="stack"
                                fill={colors.RED_ERROR}
                                barSize={selectedRange.label === 'all' ? 4 : 8}
                                shape={<CustomBar variant="sent" />}
                            />
                            <Bar
                                dataKey={(data: any) => Number(props.receivedValueFn(data))}
                                stackId="stack"
                                fill={colors.GREEN}
                                barSize={selectedRange.label === 'all' ? 4 : 8}
                                shape={<CustomBar variant="received" />}
                            />
                        </BarChart>
                    </CustomResponsiveContainer>
                )}
            </Description>
        </Wrapper>
    );
});

export default TransactionsGraph;

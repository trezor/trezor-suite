import React from 'react';
import styled from 'styled-components';
import { colors, variables, Loader, Icon } from '@trezor/components';
import { Account } from '@wallet-types';
import { GraphRange, AggregatedAccountBalanceHistory } from '@wallet-types/fiatRates';
import { BarChart, Tooltip, Bar, ReferenceLine, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import RangeSelector from './components/RangeSelector';
import CustomTooltip from './components/CustomTooltip';
import CustomXAxisTick from './components/CustomXAxisTick';
import CustomYAxisTick from './components/CustomYAxisTick';
import CustomBar from './components/CustomBar';
import { BlockchainAccountBalanceHistory } from 'trezor-connect';

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
    color: ${colors.BLACK50};
    flex: 1;
`;

const RefreshIcon = styled(Icon)`
    cursor: pointer;
`;

type AccountHistory = BlockchainAccountBalanceHistory[];

interface CommonProps {
    isLoading?: boolean;
    selectedRange: GraphRange;
    xTicks: number[];
    onSelectedRange: (range: GraphRange) => void;
    onRefresh?: () => void;
}
export interface CryptoGraphProps extends CommonProps {
    variant: 'one-asset';
    account: Account;
    data: AccountHistory | null;
    receivedValueFn: (data: AccountHistory[number]) => string;
    sentValueFn: (data: AccountHistory[number]) => string;
    localCurrency?: never;
}

export interface FiatGraphProps extends CommonProps {
    variant: 'all-assets';
    localCurrency: string;
    data: AggregatedAccountBalanceHistory[] | null;
    receivedValueFn: (data: AggregatedAccountBalanceHistory) => string | undefined;
    sentValueFn: (data: AggregatedAccountBalanceHistory) => string | undefined;
    account?: never;
}

export type Props = CryptoGraphProps | FiatGraphProps;

const TransactionsGraph = React.memo((props: Props) => {
    const { data, isLoading, selectedRange, xTicks } = props;

    // Will be useful if we'll wanna use custom ticks values
    // const minY =
    //     data && data.length > 0
    //         ? data.reduce(
    //               (min, p) => (new BigNumber(p.sent).lt(min) ? new BigNumber(p.sent) : min),
    //               new BigNumber(data[0].sent),
    //           )
    //         : null;
    // const maxY =
    //     data && data.length > 0
    //         ? data.reduce(
    //               (max, p) => (new BigNumber(p.received).gt(max) ? new BigNumber(p.received) : max),
    //               new BigNumber(data[0].received),
    //           )
    //         : null;

    const xAxisPadding = selectedRange.label === 'year' ? 3600 * 24 * 7 : 3600 * 12; // 7 days or 12 hours

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
                {!isLoading && data && data.length === 0 && <>No transactions to show</>}
                {!isLoading && data && data.length > 0 && (
                    <ResponsiveContainer height="100%" width="100%">
                        <BarChart
                            data={data}
                            stackOffset="sign"
                            margin={{
                                top: 10,
                                bottom: 30,
                                right: 10,
                                left: 20,
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
                                domain={['dataMin', 'dataMax']}
                                stroke={colors.BLACK80}
                                tick={
                                    props.variant === 'one-asset' ? (
                                        <CustomYAxisTick symbol={props.account.symbol} />
                                    ) : (
                                        <CustomYAxisTick localCurrency={props.localCurrency} />
                                    )
                                }
                            />
                            <Tooltip
                                content={
                                    props.variant === 'one-asset' ? (
                                        <CustomTooltip
                                            variant={props.variant}
                                            selectedRange={selectedRange}
                                            symbol={props.account.symbol}
                                            sentValueFn={props.sentValueFn}
                                            receivedValueFn={props.receivedValueFn}
                                        />
                                    ) : (
                                        <CustomTooltip
                                            variant={props.variant}
                                            selectedRange={selectedRange}
                                            localCurrency={props.localCurrency}
                                            sentValueFn={props.sentValueFn}
                                            receivedValueFn={props.receivedValueFn}
                                        />
                                    )
                                }
                            />
                            />
                            <ReferenceLine y={0} stroke={colors.BLACK80} />
                            <Bar
                                dataKey={(data: any) => Number(props.sentValueFn(data))}
                                stackId="stack"
                                fill={colors.RED_ERROR}
                                barSize={8}
                                shape={<CustomBar variant="sent" />}
                            />
                            <Bar
                                dataKey={(data: any) => Number(props.receivedValueFn(data))}
                                stackId="stack"
                                fill={colors.GREEN}
                                barSize={8}
                                shape={<CustomBar variant="received" />}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Description>
        </Wrapper>
    );
});

export default TransactionsGraph;

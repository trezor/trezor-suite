import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { colors, variables, Loader, Tooltip as CTooltip } from '@trezor/components';
import { HiddenPlaceholder, Badge, NoRatesTooltip, FiatValue } from '@suite-components';
import { Account } from '@wallet-types';
import BigNumber from 'bignumber.js';
import {
    BarChart,
    Tooltip,
    Bar,
    ReferenceLine,
    ResponsiveContainer,
    YAxis,
    XAxis,
    TooltipProps,
} from 'recharts';
import { fetchAccountHistory } from '@suite/actions/wallet/fiatRatesActions';
import { Await } from '@suite/types/utils';
import RangeSelector from './components/RangeSelector';
import { formatNetworkAmount } from '@suite/utils/wallet/accountUtils';
import { getDateWithTimeZone } from '@suite/utils/suite/date';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    font-size: ${variables.FONT_SIZE.TINY};
    white-space: nowrap;
`;

const Description = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${colors.BLACK50};
    flex: 1;
`;

const YAxisWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    white-space: nowrap;
    color: ${colors.BLACK80};
`;

const CustomTooltipWrapper = styled.div<{ coordinate: { x: number; y: number } }>`
    display: flex;
    flex-direction: column;
    color: ${colors.WHITE};
    background: rgba(0, 0, 0, 0.8);
    padding: 12px 12px;
    border-radius: 3px;
    transform: ${props => `translate(0px, ${props.coordinate.y - 100}px)`};

    line-height: 1.5;
`;

const Row = styled.div`
    display: flex;
    white-space: nowrap;
    align-items: baseline;
`;

const DateWrapper = styled.div`
    display: flex;
    margin-bottom: 4px;
`;

const Rect = styled.div<{ color: string }>`
    width: 8px;
    height: 8px;
    background: ${props => props.color};
    margin-right: 4px;
`;

type AccountHistory = NonNullable<Await<ReturnType<typeof fetchAccountHistory>>>;

interface Props {
    account: Account;
    data: AccountHistory | null | undefined;
    isLoading?: boolean;
    selectedRange: Range;
    onSelectedRange: (range: Range) => void;
}

interface Range {
    label: string;
    weeks: number;
}

interface CustomTooltipProps extends TooltipProps {
    symbol: Account['symbol'];
    selectedRange: Range;
}

const CustomTooltip = ({
    active,
    payload,
    coordinate,
    label,
    symbol,
    selectedRange,
    ...props
}: CustomTooltipProps) => {
    console.log(coordinate);
    console.log('props', props);
    if (active && payload) {
        const date = getDateWithTimeZone(payload[0].payload.time * 1000);
        return (
            <CustomTooltipWrapper coordinate={coordinate!}>
                <DateWrapper>
                    {date && selectedRange?.label === 'year' && (
                        <FormattedDate value={date} year="numeric" month="2-digit" />
                    )}
                    {date && selectedRange?.label !== 'year' && (
                        <FormattedDate value={date} year="numeric" month="2-digit" day="2-digit" />
                    )}
                </DateWrapper>
                <Row>
                    <Rect color={colors.GREEN} /> Received {payload[0].payload.received}{' '}
                    {symbol.toUpperCase()} (
                    <FiatValue
                        amount={payload[0].payload.received}
                        symbol={symbol}
                        source={payload[0].payload.rates}
                    >
                        {({ value }) => value}
                    </FiatValue>
                    )
                </Row>
                <Row>
                    <Rect color={colors.RED_ERROR} /> Sent {payload[0].payload.sent}{' '}
                    {symbol.toUpperCase()} (
                    <FiatValue
                        amount={payload[0].payload.sent}
                        symbol={symbol}
                        source={payload[0].payload.rates}
                    >
                        {({ value }) => value}
                    </FiatValue>
                    )
                </Row>
            </CustomTooltipWrapper>
        );
    }

    return null;
};

interface CustomXAxisProps {
    selectedRange: Range;
    [k: string]: any;
}

const CustomizedXAxisTick = (props: CustomXAxisProps) => {
    const { x, y, stroke, payload } = props;
    const date = getDateWithTimeZone(payload.value * 1000);
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-45)">
                {date && props.selectedRange?.label === 'year' && (
                    <FormattedDate value={date} month="long" />
                )}
                {date && props.selectedRange?.label !== 'year' && (
                    <FormattedDate value={date} day="2-digit" month="2-digit" />
                )}
            </text>
        </g>
    );
};

const CustomizedYAxisTick = (props: any) => {
    const { x, y, stroke, payload } = props;

    return (
        // <YAxisWrapper>
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={2} textAnchor="start" fill="#666">
                {new BigNumber(payload.value).toFixed(2)}
            </text>
        </g>
        // </YAxisWrapper>
    );
};

const AccountTransactionsGraph = React.memo((props: Props) => {
    const { data, isLoading, selectedRange } = props;

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

    return (
        <Wrapper>
            <RangeSelector selectedRange={selectedRange} onSelectedRange={props.onSelectedRange} />
            <Description>
                {isLoading && <Loader size={24} />}
                {!isLoading && data && data.length === 0 && <>No transactions to show</>}
                {!isLoading && data && data.length > 0 && (
                    <ResponsiveContainer id={props.account.symbol} height="100%" width="100%">
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
                                // SLOW
                                // type="number"
                                // tickCount={86400 * 30}
                                // domain={['dataMin', 'dataMax']}
                                // width={10}
                                stroke={colors.BLACK80}
                                // tick={{ fill: colors.BLACK50 }}
                                // tickFormatter={(tickItem: number) =>
                                //     new Date(tickItem * 1000).toLocaleDateString()
                                // }
                                interval={0}
                                tick={<CustomizedXAxisTick selectedRange={selectedRange} />}
                            />
                            <YAxis
                                type="number"
                                orientation="right"
                                domain={['dataMin', 'dataMax']}
                                stroke={colors.BLACK80}
                                // tick={{ fill: colors.BLACK50 }}
                                tick={<CustomizedYAxisTick />}
                                // axisLine={{ stroke: colors.BLACK80 }}
                                // axisLine={false}
                                // tickLine={false}
                                // tickFormatter={(amount: string) =>
                                //     `${formatNetworkAmount(
                                //         amount,
                                //         props.account.symbol,
                                //     )} ${props.account.symbol.toUpperCase()}`
                                // }
                            />
                            <Tooltip
                                // position={{ y: 0, x: 0 }}
                                // allowEscapeViewBox={{ x: true }}
                                content={
                                    <CustomTooltip
                                        selectedRange={selectedRange}
                                        symbol={props.account.symbol}
                                    />
                                }
                                cursor={{ fill: '#fff' }}
                            />
                            />
                            <ReferenceLine y={0} stroke={colors.BLACK80} />
                            <Bar
                                dataKey={(data: AccountHistory[number]) => Number(data.sent)}
                                stackId="stack"
                                fill={colors.RED_ERROR}
                                maxBarSize={10}
                                // minPointSize={1}
                            />
                            <Bar
                                dataKey={(data: AccountHistory[number]) => Number(data.received)}
                                stackId="stack"
                                fill={colors.GREEN}
                                maxBarSize={10}
                                // minPointSize={data.received === '0' ? 0 : 1}
                                // minPointSize={1}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Description>
        </Wrapper>
    );
});

export default AccountTransactionsGraph;

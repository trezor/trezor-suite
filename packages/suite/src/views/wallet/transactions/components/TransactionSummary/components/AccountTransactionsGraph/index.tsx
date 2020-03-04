import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { colors, variables, Loader } from '@trezor/components';
import { FiatValue } from '@suite-components';
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
import { getDateWithTimeZone, calcTicks } from '@suite/utils/suite/date';
import { getUnixTime } from 'date-fns';

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

// const YAxisWrapper = styled.div`
//     font-size: ${variables.FONT_SIZE.TINY};
//     white-space: nowrap;
//     color: ${colors.BLACK80};
// `;

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
    symbol,
    selectedRange,
}: CustomTooltipProps) => {
    if (active && payload) {
        const date = getDateWithTimeZone(payload[0].payload.time * 1000);
        return (
            <CustomTooltipWrapper coordinate={coordinate!}>
                <DateWrapper>
                    {date && selectedRange?.label === 'year' && (
                        //
                        <FormattedDate value={date} year="numeric" month="2-digit" />
                    )}
                    {date && selectedRange?.label !== 'year' && (
                        <FormattedDate value={date} year="numeric" month="2-digit" day="2-digit" />
                    )}
                </DateWrapper>
                <Row>
                    <Rect color={colors.GREEN} /> Received {payload[0].payload.received}{' '}
                    {symbol.toUpperCase()}
                    <FiatValue
                        amount={payload[0].payload.received}
                        symbol={symbol}
                        source={payload[0].payload.rates}
                    >
                        {({ value }) => (value ? <> ({value})</> : null)}
                    </FiatValue>
                </Row>
                <Row>
                    <Rect color={colors.RED_ERROR} /> Sent {payload[0].payload.sent}{' '}
                    {symbol.toUpperCase()}
                    <FiatValue
                        amount={payload[0].payload.sent}
                        symbol={symbol}
                        source={payload[0].payload.rates}
                    >
                        {({ value }) => (value ? <> ({value})</> : null)}
                    </FiatValue>
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
    const { x, y, payload } = props;
    const date = getDateWithTimeZone(payload.value * 1000);
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-50)">
                {date && props.selectedRange?.label === 'year' && (
                    <FormattedDate value={date} month="2-digit" year="numeric" />
                )}
                {date && props.selectedRange?.label !== 'year' && (
                    <FormattedDate value={date} day="2-digit" month="2-digit" />
                )}
            </text>
        </g>
    );
};

const CustomizedYAxisTick = (props: any) => {
    const { x, y, payload } = props;

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

interface CustomBarProps {
    variant: 'sent' | 'received';
    [key: string]: any;
}

const CustomBar = (props: CustomBarProps) => {
    const { fill, x, y, width, height, payload, variant } = props;
    let forcedHeightChange = false;
    let minHeight = height;
    if (
        (variant === 'sent' && Math.abs(height) < 1 && payload.sent !== '0') ||
        (variant === 'received' && Math.abs(height) < 1 && payload.received !== '0')
    ) {
        // make sure small amounts are visible by forcing minHeight of 2 if abs(amount) < 1
        minHeight = variant === 'sent' ? -2 : 2;
        forcedHeightChange = true;
    }

    const diffPosY = forcedHeightChange ? Math.abs(minHeight) - Math.abs(height) : 0;
    return (
        <rect
            fill={fill}
            x={x}
            y={minHeight < 0 ? y + diffPosY + minHeight : y - diffPosY}
            width={width}
            height={Math.abs(minHeight)}
        />
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

    const XTicks = calcTicks(selectedRange.weeks).map(getUnixTime);

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
                                type="number"
                                domain={[XTicks[0], XTicks[XTicks.length - 1]]}
                                width={10}
                                stroke={colors.BLACK80}
                                interval={0}
                                tick={<CustomizedXAxisTick selectedRange={selectedRange} />}
                                ticks={XTicks}
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
                                // cursor={{ fill: '#D9F3FF' }}
                            />
                            />
                            <ReferenceLine y={0} stroke={colors.BLACK80} />
                            <Bar
                                dataKey={(data: AccountHistory[number]) => Number(data.sent)}
                                stackId="stack"
                                fill={colors.RED_ERROR}
                                barSize={10}
                                shape={<CustomBar variant="sent" />}
                                // minPointSize={1}
                            />
                            <Bar
                                dataKey={(data: AccountHistory[number]) => Number(data.received)}
                                stackId="stack"
                                fill={colors.GREEN}
                                barSize={10}
                                shape={<CustomBar variant="received" />}
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

import React from 'react';
import styled from 'styled-components';
import { colors, variables, Loader } from '@trezor/components';
import { Account } from '@wallet-types';
import { BarChart, Tooltip, Bar, ReferenceLine, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import { fetchAccountHistory } from '@suite/actions/wallet/fiatRatesActions';
import { Await } from '@suite/types/utils';
import RangeSelector from './components/RangeSelector';
import { calcTicks } from '@suite/utils/suite/date';
import { getUnixTime } from 'date-fns';
import CustomTooltip from './components/CustomTooltip';
import CustomXAxisTick from './components/CustomXAxisTick';
import CustomYAxisTick from './components/CustomYAxisTick';
import CustomBar from './components/CustomBar';

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
    const xAxisPadding = selectedRange.label === 'year' ? 3600 * 24 * 7 : 3600 * 12; // 7 days or 12 hours

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
                                domain={[
                                    XTicks[0] - xAxisPadding,
                                    XTicks[XTicks.length - 1] + xAxisPadding,
                                ]}
                                // width={10}
                                stroke={colors.BLACK80}
                                interval={0}
                                tick={<CustomXAxisTick selectedRange={selectedRange} />}
                                ticks={XTicks}
                            />
                            <YAxis
                                type="number"
                                orientation="right"
                                domain={['dataMin', 'dataMax']}
                                stroke={colors.BLACK80}
                                tick={<CustomYAxisTick />}
                            />
                            <Tooltip
                                content={
                                    <CustomTooltip
                                        selectedRange={selectedRange}
                                        symbol={props.account.symbol}
                                    />
                                }
                            />
                            />
                            <ReferenceLine y={0} stroke={colors.BLACK80} />
                            <Bar
                                dataKey={(data: AccountHistory[number]) => Number(data.sent)}
                                stackId="stack"
                                fill={colors.RED_ERROR}
                                barSize={8}
                                shape={<CustomBar variant="sent" />}
                            />
                            <Bar
                                dataKey={(data: AccountHistory[number]) => Number(data.received)}
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

export default AccountTransactionsGraph;

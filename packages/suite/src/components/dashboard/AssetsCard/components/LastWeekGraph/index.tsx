import React from 'react';
import { Network } from '@wallet-types';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { LastWeekRates } from '@wallet-reducers/fiatRateReducer';

const greenArea = '#D6F3CC';
const greenStroke = '#30c100';
const redArea = '#F6DBDB';
const redStroke = '#d04949';

interface Props {
    lastWeekData?: LastWeekRates['tickers'];
    symbol: Network['symbol'];
    localCurrency: string;
}

const LastWeekGraph = React.memo(({ lastWeekData, symbol, localCurrency }: Props) => {
    let isGraphGreen = false;

    if (lastWeekData) {
        const firstDataPoint = lastWeekData[0];
        const lastDataPoint = lastWeekData[lastWeekData.length - 1];
        if (lastDataPoint.rates[localCurrency] && firstDataPoint.rates[localCurrency]) {
            isGraphGreen =
                lastDataPoint.rates[localCurrency]! > firstDataPoint.rates[localCurrency]!;
        }
    }

    return (
        <ResponsiveContainer id={symbol} height="100%" width="100%">
            <AreaChart
                data={lastWeekData}
                margin={{
                    right: 10,
                    left: 0,
                }}
            >
                <defs>
                    <linearGradient id="greenAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="30%" stopColor={greenArea} stopOpacity={1} />
                        <stop offset="95%" stopColor="#fff" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="redAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="30%" stopColor={redArea} stopOpacity={1} />
                        <stop offset="95%" stopColor="#fff" stopOpacity={1} />
                    </linearGradient>
                </defs>
                <YAxis hide type="number" domain={['dataMin', 'dataMax']} />
                <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey={data => data.rates.eur}
                    stroke={isGraphGreen ? greenStroke : redStroke}
                    fill={isGraphGreen ? 'url(#greenAreaGradient)' : 'url(#redAreaGradient)'}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
});

export default LastWeekGraph;

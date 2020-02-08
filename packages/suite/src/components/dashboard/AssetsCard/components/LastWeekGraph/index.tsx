import React from 'react';
import { Network } from '@wallet-types';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const greenArea = '#D6F3CC';
const greenStroke = '#30c100';
const redArea = '#F6DBDB';
const redStroke = '#d04949';

const data = [
    { value: 9740.87 },
    { value: 9768.26 },
    { value: 9764.02 },
    { value: 9780.41 },
    { value: 9726.36 },
    { value: 9796.86 },
    { value: 9720.43 },
    { value: 9747.13 },
    { value: 9704.88 },
    { value: 9635.48 },
    { value: 9621.24 },
    { value: 9599.1 },
    { value: 9651.45 },
    { value: 9532.49 },
    { value: 9427.95 },
    { value: 9238.45 },
    { value: 9247.88 },
    { value: 9171.7 },
    { value: 9153.34 },
    { value: 9204.57 },
    { value: 9128.17 },
    { value: 9158.79 },
    { value: 9274.97 },
    { value: 9261.92 },
    { value: 9262.48 },
    { value: 9284.67 },
    { value: 9317.94 },
    { value: 9323.15 },
    { value: 9381.96 },
    { value: 9524.7 },
    { value: 9407.32 },
    { value: 9411.31 },
    { value: 9391.68 },
    { value: 9356.87 },
    { value: 9281.96 },
    { value: 9311.06 },
    { value: 9349.76 },
    { value: 9365.6 },
    { value: 9312.13 },
    { value: 9392.26 },
    { value: 9367.85 },
    { value: 9401.14 },
];
interface Props {
    lastWeekData?: any;
    symbol: Network['symbol'];
}

const LastWeekGraph = React.memo(({ lastWeekData, symbol }: Props) => {
    let isGraphGreen = false;

    return (
        <ResponsiveContainer id={symbol} height="100%" width="100%">
            <AreaChart
                data={data}
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
                    dataKey={data => data.value}
                    stroke={isGraphGreen ? greenStroke : redStroke}
                    fill={isGraphGreen ? 'url(#greenAreaGradient)' : 'url(#redAreaGradient)'}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
});

export default LastWeekGraph;

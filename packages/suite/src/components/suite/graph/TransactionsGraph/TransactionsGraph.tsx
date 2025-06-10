/**
 * spojitost čáry?
 * co když je hodně dat?
 *
 *
 * */

import { useMemo } from 'react';

import { format } from 'date-fns';
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import styled, { useTheme } from 'styled-components';

import { Column, Icon, Paragraph, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import { useSelector } from '../../../../hooks/suite';
import { selectLocalCurrency } from '../../../../reducers/wallet/settingsReducer';

const TooltipContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 8px;
    background-color: ${({ theme }) => hexToRgba(theme.backgroundSurfaceElevation0, 0.6)};
    border-radius: 4px;
    backdrop-filter: blur(10px);
`;

const raw2 = [
    { date: '2025-01-01T12:00:00.000Z', value: 1000 },
    { date: '2025-01-02T12:00:00.000Z', value: 1398 },
    { date: '2025-01-03T12:00:00.000Z', value: 9800 },
    { date: '2025-01-03T12:00:00.000Z', value: 3908 },
    { date: '2025-01-04T12:00:00.000Z', value: 4800 },
    { date: '2025-01-05T12:00:00.000Z', value: 3800 },
    { date: '2025-01-06T12:00:00.000Z', value: 8300 },
    { date: '2025-01-06T12:00:00.000Z', value: 4300 },
    { date: '2025-01-07T12:00:00.000Z', value: 5300 },
    { date: '2025-01-08T12:00:00.000Z', value: 8700 },
    { date: '2025-01-09T12:00:00.000Z', value: 7100 },
    { date: '2025-01-10T12:00:00.000Z', value: 13600 },
    { date: '2025-01-11T12:00:00.000Z', value: 18800 },
    { date: '2025-01-11T12:00:00.000Z', value: 1000 },
    { date: '2025-01-12T12:00:00.000Z', value: 5900 },
    { date: '2025-01-13T12:00:00.000Z', value: 8000 },
    { date: '2025-01-14T12:00:00.000Z', value: 11000 },
    { date: '2025-01-14T12:00:00.000Z', value: 13000 },
    { date: '2025-01-15T12:00:00.000Z', value: 12000 },
    { date: '2025-01-15T12:00:00.000Z', value: 21000 },
    { date: '2025-01-16T12:00:00.000Z', value: 26000 },
    { date: '2025-01-17T12:00:00.000Z', value: 29000 },
    { date: '2025-01-18T12:00:00.000Z', value: 30100 },
    { date: '2025-01-19T12:00:00.000Z', value: 20000 },
    { date: '2025-01-20T12:00:00.000Z', value: 17200 },
    { date: '2025-01-21T12:00:00.000Z', value: 9000 },
    { date: '2025-01-22T12:00:00.000Z', value: 13000 },
    { date: '2025-01-22T12:00:00.000Z', value: 16000 },
    { date: '2025-01-23T12:00:00.000Z', value: 18000 },
    { date: '2025-01-24T12:00:00.000Z', value: 23000 },
    { date: '2025-01-25T12:00:00.000Z', value: 27000 },
    { date: '2025-01-26T12:00:00.000Z', value: 35000 },
    { date: '2025-01-27T12:00:00.000Z', value: 33000 },
    { date: '2025-01-27T12:00:00.000Z', value: 13000 },
    { date: '2025-01-28T12:00:00.000Z', value: 10000 },
    { date: '2025-01-29T12:00:00.000Z', value: 12000 },
];

// generate raw data with some configuration: interval, min, max, count.
// every 5-20th day add data with the same date but different value to simulate vertical jump. Trend should be up
// There should be extremes only sometimes. Date should be in iso format.
function generateData(start: number, min: number, max: number, count: number) {
    const result = [];
    let current = start;
    for (let i = 0; i < count; i++) {
        // create small variance but multiply it with index
        // to simulate trends

        const variance = Math.floor(Math.random() * 0.1);
        const value = Math.floor(Math.random() * (max - min) * i) + min;

        result.push({ date: new Date(current).toISOString(), value });
        current += 1000 * 60 * 60 * 24 * 3;
        if (Math.random() > 0.85) {
            result.push({ date: new Date(current).toISOString(), value });
        }
    }

    return result;
}

const raw = generateData(new Date().getTime(), 80000, 120000, 120);

const dateFormatter = (date: string) => format(new Date(date), 'd MMM');
const dateFormatterWithYear = (date: string) => format(new Date(date), 'd MMMM yyyy');

const CustomizedDot = props => {
    const theme = useTheme();
    const { cx, cy, points, index } = props;
    const nextIndex = points.length >= index + 1 ? index + 1 : null;
    const currentPoint = points[index];
    const nextPoint = points[nextIndex];
    if (nextIndex == null || currentPoint?.x !== nextPoint?.x) return null;

    if (currentPoint?.y < nextPoint?.y) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 32 32"
                x={cx - 8}
                y={cy - 8}
                width={16}
                height={16}
            >
                <circle cx="32" cy="32" r="32" fill={theme.backgroundSurfaceElevation1} />

                <path
                    fill={theme.backgroundAlertRedBold}
                    d="M22 16a1 1 0 0 1-1 1H11a1 1 0 0 1 0-2h10a1 1 0 0 1 1 1m7 0A13 13 0 1 1 16 3a13.014 13.014 0 0 1 13 13m-2 0a11 11 0 1 0-11 11 11.01 11.01 0 0 0 11-11"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 32 32"
            x={cx - 8}
            y={cy - 8}
            width={16}
            height={16}
        >
            <circle cx="16" cy="16" r="16" fill={theme.backgroundSurfaceElevation1} />
            <path
                fill={theme.backgroundSecondaryDefault}
                d="M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m0 24a11 11 0 1 1 11-11 11.01 11.01 0 0 1-11 11m6-11a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-2 0v-4h-4a1 1 0 0 1 0-2h4v-4a1 1 0 0 1 2 0v4h4a1 1 0 0 1 1 1"
            />
        </svg>
    );
};

const CustomTooltip = props => {
    const { active, payload, label } = props;

    if (active && payload && payload.length) {
        const interval = props.payload.filter(({ name }) => name.startsWith('main-line'));
        const from = interval[0].payload;
        const to = interval.length > 1 ? interval[1].payload : null;

        return (
            <TooltipContainer>
                <Column>
                    {to ? (
                        <>
                            {from.value < to?.value && (
                                <Paragraph variant="primary" typographyStyle="highlight">
                                    příjem
                                </Paragraph>
                            )}
                            {from.value > to?.value && (
                                <Paragraph variant="destructive" typographyStyle="highlight">
                                    výdaj
                                </Paragraph>
                            )}
                            <Row gap={spacings.xs} alignItems="center">
                                <Text typographyStyle="hint">{from.value} CZK</Text>{' '}
                                <Icon name="arrowRight" variant="tertiary" size="small" />{' '}
                                <Text typographyStyle="hint">{to.value} CZK</Text>
                            </Row>
                        </>
                    ) : (
                        <Paragraph>{from.value} CZK</Paragraph>
                    )}

                    <Paragraph
                        variant="tertiary"
                        typographyStyle="label"
                        margin={{ top: spacings.xs }}
                    >
                        {dateFormatterWithYear(from.date)}
                    </Paragraph>
                </Column>
            </TooltipContainer>
        );
    }

    return null;
};

export const TransactionsGraph = () => {
    const theme = useTheme();
    const { segments, verticalSegments, marks } = useMemo(() => {
        const segments = []; // úseky hlavní křivky
        let seg = [];

        const verticalSegments = []; // každá položka = [cur, next]
        const marks = []; // + / − značky

        for (let i = 0; i < raw.length; i++) {
            const cur = raw[i];
            const next = raw[i + 1];

            seg.push(cur);

            if (next && next.date === cur.date) {
                // vertikální skok
                verticalSegments.push([cur, next]);

                marks.push({
                    date: cur.date, // 1. bod skoku
                    value: cur.value,
                    symbol: next.value > cur.value ? '+' : '−',
                });

                segments.push(seg); // ukonči úsek
                seg = [next]; // nový úsek
                i++; // přeskoč použitý bod
            }
        }
        segments.push(seg);

        return { segments, verticalSegments, marks };
    }, []);

    const ticks = raw // raw = tvoje pole dat
        .map(d => d.date) // => [1,2,3,3,5,6,6,7]
        .filter((_, i, arr) => i !== 0 && i !== arr.length - 1);

    const findDateWithMaxValue = (data: any) => {
        const maxValue = Math.max(...data.map(d => d.value));
        const index = data.findIndex(d => d.value === maxValue);

        return data[index];
    };

    const maxValue = findDateWithMaxValue(raw);
    const minValue = findDateWithMaxValue(raw2);

    return (
        <>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={raw} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                    <XAxis
                        tick={{ fontSize: 12 }}
                        dataKey="date"
                        allowDuplicatedCategory={false}
                        tickFormatter={dateFormatter}
                        minTickGap={100}
                        tickLine={false}
                        axisLine={false}
                        padding={{ left: 0, right: 0 }}
                        interval="preserveStartEnd"
                        ticks={ticks}
                    />
                    <ReferenceLine x="Page C" stroke="green" label="Min PAGE" />
                    <Tooltip
                        animationDuration={100}
                        cursor={{
                            stroke: theme.backgroundNeutralBold,
                            strokeWidth: 2,
                            strokeDasharray: '3 6',

                            strokeLinejoin: 'round',
                            strokeLinecap: 'round',
                        }}
                        content={<CustomTooltip />}
                    />
                    <defs>
                        {/* vektor jde od (0,0) do (0,200) v uživatelských jednotkách (px) */}
                        <linearGradient
                            id="gradient-area"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="300"
                            gradientUnits="userSpaceOnUse" /* ↔ absolutní souřadnice */
                        >
                            {/* 0   = horní bod vektoru = 200 px NAD spodkem tvaru → plná zelená */}
                            <stop
                                offset="0"
                                stopColor={theme.backgroundSecondaryDefault}
                                stopOpacity="0.2"
                            />

                            {/* 1   = dolní bod vektoru = skutečné dno tvaru    → úplně průhledná */}
                            <stop
                                offset="1"
                                stopColor={theme.backgroundSecondaryDefault}
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                    {/* hlavní křivka */}
                    );
                    {segments.map((segment, index) => (
                        <Area
                            key={`main-${index}`}
                            data={segment}
                            type="monotone"
                            dataKey="value"
                            stroke={theme.backgroundPrimaryDefault}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                            legendType={index ? 'none' : undefined}
                            fill="url(#gradient-area)"
                            name={`main-line-${index}`}
                        />
                    ))}
                    {/* samostatná čárkovaná vertikála pro každý skok */}
                    {verticalSegments.map((pair, index) => {
                        const firstPoint = pair[0];
                        const lastPoint = pair[pair.length - 1];
                        // if (nextIndex == null || nextPoint === null) return null;
                        const isPositive = firstPoint.value <= lastPoint.value;

                        return (
                            <Line
                                key={`v-${index}`}
                                data={pair}
                                type="linear"
                                dataKey="value"
                                stroke={
                                    isPositive
                                        ? theme.backgroundSecondaryDefault
                                        : theme.backgroundAlertRedBold
                                }
                                strokeWidth={1.5}
                                strokeDasharray="3 6"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                // dot={false}
                                isAnimationActive={false}
                                legendType="none"
                                dot={<CustomizedDot />}
                                name={`jump-${index}`}
                            />
                        );
                    })}
                </ComposedChart>
            </ResponsiveContainer>
        </>
    );
};

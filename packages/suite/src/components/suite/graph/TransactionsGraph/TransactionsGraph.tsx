import { useEffect, useState } from 'react';

import { differenceInDays, format, subMonths } from 'date-fns';
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

const TooltipContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 8px;
    background-color: ${({ theme }) => hexToRgba(theme.backgroundSurfaceElevation0, 0.6)};
    border-radius: 4px;
    backdrop-filter: blur(10px);
`;

export const generateData = (startDate: Date, endDate: Date) => {
    const getNewValue = (previousValue: number) => {
        const howClose = 0.52 - Math.random();
        const value = Math.floor(previousValue + Math.random() + 1000 * howClose);
        return value > 0 ? value : 0;
    };

    const endDateValue = endDate ?? new Date();
    const startDateValue = startDate ?? subMonths(new Date(), 24);

    const daysCount = differenceInDays(endDateValue, startDateValue);

    const result = [];
    let current = startDateValue.getTime();
    let previousValue = 0;
    for (let i = 0; i < daysCount; i++) {
        const newValue = getNewValue(previousValue);
        previousValue = newValue;

        result.push({ date: new Date(current).toISOString(), value: newValue });
        current += 1000 * 60 * 60 * 24 * 3;
        if (Math.random() > 0.85) {
            result.push({
                date: new Date(current).toISOString(),
                value: getNewValue(previousValue),
            });
        }
    }

    return result;
};

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
                <circle cx="16" cy="16" r="16" fill={theme.backgroundSurfaceElevation1} />

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

export const TransactionsGraph = ({ selectedRange }) => {
    const theme = useTheme();
    const [segments, setSegments] = useState([]);
    const [raw, setRaw] = useState([]);
    const [verticalSegments, setVerticalSegments] = useState([]);
    const [ticks, setTicks] = useState([]);

    const removeData = () => {
        setVerticalSegments([]);
        setTicks([]);
        setRaw([]);
        setSegments([]);
    };

    useEffect(() => {
        removeData();
        const data = generateData(selectedRange.startDate, selectedRange.endDate, 80000, 120000);
        setRaw(data);

        const newSegments = [];
        const newVerticalSegments = [];
        const newTicks = [];

        let seg = [];
        for (let i = 0; i < data.length; i++) {
            const cur = data[i];
            const next = data[i + 1];

            seg.push(cur);

            if (next && next.date === cur.date) {
                // Vertical jump
                newVerticalSegments.push([cur, next]);

                newSegments.push(seg); // End current segment
                seg = [next]; // Start new segment
                i++; // Skip used point
            }
        }
        newSegments.push(seg);

        setSegments(newSegments);
        setVerticalSegments(newVerticalSegments);
        setTicks(data.map(d => d.date).filter((_, i, arr) => i !== 0 && i !== arr.length - 1));
    }, [selectedRange]);

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
                        ticks={[...new Set(ticks)]}
                    />
                    <ReferenceLine x="Page C" stroke="green" label="Min PAGE" />
                    {/*<CartesianGrid strokeDasharray="1 10" />*/}
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
                            type="linear"
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

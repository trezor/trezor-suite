import { typographyStylesBase } from '@trezor/theme';

import { type Account } from 'src/types/wallet';
import { type GraphData, type GraphRange } from 'src/types/wallet/graph';
import { accountGraphDataFilterFn, aggregateBalanceHistory } from 'src/utils/wallet/graph';

export type GraphDataPoint = {
    time: number;
    value: number;
};

export type BalanceEntry = {
    balance: string;
    time: number;
};

export type RangeBounds = {
    endTime: number;
    startTime: number;
    window: number;
};

const PRESET_RANGE_WINDOWS = {
    day: 24 * 3600,
    month: 30 * 24 * 3600,
    week: 7 * 24 * 3600,
    year: 365 * 24 * 3600,
} as const;

const ALL_RANGE_WINDOW_BUFFER_SECS = 24 * 3600;
export const LIVELINE_WINDOW_TRANSITION_MS = 900;
export const HISTORICAL_GRAPH_PADDING = { top: 0, bottom: 30, left: 0 };
export const HISTORICAL_GRAPH_TYPOGRAPHY = {
    scrubFont: {
        size: typographyStylesBase['body-md'].fontSize,
        family: ['TT Satoshi'],
        weight: typographyStylesBase['body-md'].fontWeight,
    },
    gridLabelFont: {
        size: typographyStylesBase['body-xs'].fontSize,
        family: ['TT Satoshi'],
        weight: typographyStylesBase['body-xs'].fontWeight,
    },
};
export const buildBalanceSteps = (
    graphData: readonly GraphData[],
    account: Account,
): BalanceEntry[] => {
    const accountData = graphData.filter(d => accountGraphDataFilterFn(d, account));
    if (!accountData[0]?.data?.length) return [];

    const aggregated = aggregateBalanceHistory(accountData, 'day', 'account');

    return aggregated.map(d => ({
        time: d.time,
        balance: d.balance,
    }));
};

export const appendCurrentBalance = (steps: BalanceEntry[], currentBalance: string) => {
    const lastStep = steps.at(-1);

    if (!lastStep) {
        return steps;
    }

    if (lastStep.balance === currentBalance) {
        return steps;
    }

    return [...steps, { time: lastStep.time + 1, balance: currentBalance }];
};

const findFloorIndexByTime = <T extends { time: number }>(
    entries: readonly T[],
    time: number,
): number => {
    if (entries.length === 0) {
        return -1;
    }

    if (time <= (entries[0]?.time ?? Number.NEGATIVE_INFINITY)) {
        return 0;
    }

    const lastIndex = entries.length - 1;
    if (time >= (entries[lastIndex]?.time ?? Number.POSITIVE_INFINITY)) {
        return lastIndex;
    }

    let lowIndex = 0;
    let highIndex = lastIndex;

    while (highIndex - lowIndex > 1) {
        const middleIndex = (lowIndex + highIndex) >> 1;

        if ((entries[middleIndex]?.time ?? Number.POSITIVE_INFINITY) <= time) {
            lowIndex = middleIndex;
        } else {
            highIndex = middleIndex;
        }
    }

    return lowIndex;
};

export const balanceAtTime = (steps: BalanceEntry[], time: number): number => {
    const index = findFloorIndexByTime(steps, time);

    return parseFloat(steps[index]?.balance ?? '0');
};

export const valueAtTime = (points: GraphDataPoint[], time: number): number => {
    const index = findFloorIndexByTime(points, time);

    return points[index]?.value ?? 0;
};

export const priceAtTime = (
    points: {
        price: number;
        time: number;
    }[],
    time: number,
): number => {
    const index = findFloorIndexByTime(points, time);

    return points[index]?.price ?? 0;
};

export const findClosestTime = (
    points: readonly { time: number }[],
    time: number,
): number | undefined => {
    const lowIndex = findFloorIndexByTime(points, time);

    if (lowIndex < 0) {
        return;
    }

    const lowTime = points[lowIndex]?.time;
    const highTime = points[lowIndex + 1]?.time;

    if (lowTime === undefined || highTime === undefined) {
        return lowTime;
    }

    return Math.abs(lowTime - time) <= Math.abs(highTime - time) ? lowTime : highTime;
};

export const aggregateBalanceStepSets = (stepSets: BalanceEntry[][]): BalanceEntry[] => {
    const nonEmptyStepSets = stepSets.filter(stepSet => stepSet.length > 0);

    if (nonEmptyStepSets.length === 0) {
        return [];
    }

    // Prepend a zero anchor so balanceAtTime returns 0 before each account's first step.
    const anchoredStepSets = nonEmptyStepSets.map(stepSet => {
        const firstStep = stepSet.at(0);

        return firstStep ? [{ time: firstStep.time - 1, balance: '0' }, ...stepSet] : [];
    });

    const timeline = Array.from(
        new Set(nonEmptyStepSets.flatMap(stepSet => stepSet.map(step => step.time))),
    ).sort((a, b) => a - b);

    const aggregatedSteps: BalanceEntry[] = [];

    timeline.forEach(time => {
        const balance = anchoredStepSets.reduce(
            (sum, stepSet) => sum + balanceAtTime(stepSet, time),
            0,
        );
        const previousBalance = aggregatedSteps[aggregatedSteps.length - 1]?.balance;
        const nextBalance = balance.toString();

        if (previousBalance === nextBalance) {
            return;
        }

        aggregatedSteps.push({
            time,
            balance: nextBalance,
        });
    });

    return aggregatedSteps;
};

export const buildCoinHistoricalSeries = ({
    balanceSteps,
    priceHistory,
}: {
    balanceSteps: BalanceEntry[];
    priceHistory: {
        price: number;
        time: number;
    }[];
}): GraphDataPoint[] => {
    if (balanceSteps.length === 0 || priceHistory.length === 0) {
        return [];
    }

    const earliestBalanceTime = balanceSteps.at(0)?.time;

    if (earliestBalanceTime === undefined) {
        return [];
    }
    const zeroAnchorTime = earliestBalanceTime - 30 * 24 * 3600;
    const timeline = priceHistory
        .map(point => point.time)
        .filter(time => time >= earliestBalanceTime);

    if (timeline.length === 0 || timeline[0] !== earliestBalanceTime) {
        timeline.unshift(earliestBalanceTime);
    }

    return [
        { time: zeroAnchorTime, value: 0 },
        { time: earliestBalanceTime - 1, value: 0 },
        ...timeline.map(time => ({
            time,
            value: balanceAtTime(balanceSteps, time) * priceAtTime(priceHistory, time),
        })),
    ];
};

export const getDashboardAlignmentStepSecs = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'day':
            return 5 * 60;
        case 'week':
            return 60 * 60;
        case 'month':
            return 60 * 60;
        case 'year':
        case 'all':
            return 24 * 60 * 60;
        default:
            return 24 * 60 * 60;
    }
};

export const getHistoricalGraphStyling = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'day':
            return { lineWidth: 2, markerOutlineSize: 4, markerSize: 4 };
        case 'week':
        case 'month':
            return { lineWidth: 2, markerOutlineSize: 3, markerSize: 3 };
        case 'year':
        case 'all':
            return { lineWidth: 2, markerOutlineSize: 0, markerSize: 2 };
        default:
            return { lineWidth: 2, markerOutlineSize: 4, markerSize: 4 };
    }
};

const buildAlignedTimeline = ({
    endTime,
    startTime,
    stepSecs,
}: {
    endTime: number;
    startTime: number;
    stepSecs: number;
}) => {
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
        return [];
    }

    const timeline = new Set<number>([startTime, endTime]);
    const firstAlignedTime = Math.ceil(startTime / stepSecs) * stepSecs;

    for (let time = firstAlignedTime; time < endTime; time += stepSecs) {
        if (time > startTime) {
            timeline.add(time);
        }
    }

    return Array.from(timeline).sort((left, right) => left - right);
};

export const buildAlignedPortfolioSeriesFromCoinSeries = ({
    coinSeriesEntries,
    rangeLabel,
    startTime,
}: {
    coinSeriesEntries: readonly GraphDataPoint[][];
    rangeLabel: GraphRange['label'];
    startTime?: number;
}): GraphDataPoint[] => {
    const nonEmptyCoinSeriesEntries = coinSeriesEntries.filter(points => points.length > 0);

    if (nonEmptyCoinSeriesEntries.length === 0) {
        return [];
    }

    const seriesStartTime = Math.min(
        ...nonEmptyCoinSeriesEntries.flatMap(points => points.at(0)?.time ?? []),
    );
    const endTime = Math.max(
        ...nonEmptyCoinSeriesEntries.flatMap(points => points.at(-1)?.time ?? []),
    );
    const timeline = buildAlignedTimeline({
        startTime: Math.max(startTime ?? seriesStartTime, seriesStartTime),
        endTime,
        stepSecs: getDashboardAlignmentStepSecs(rangeLabel),
    });

    return timeline.map(time => ({
        time,
        value: nonEmptyCoinSeriesEntries.reduce(
            (sum, points) => sum + valueAtTime(points, time),
            0,
        ),
    }));
};

export const getRangeKey = (selectedRange: GraphRange) =>
    `${selectedRange.label}:${selectedRange.startDate ?? 'null'}:${selectedRange.endDate ?? 'null'}`;

export const getRangeBounds = (selectedRange: GraphRange, now: number): RangeBounds | undefined => {
    if (selectedRange.label === 'all') {
        return;
    }

    if (selectedRange.label === 'range') {
        const startTime = selectedRange.startDate / 1000;
        const endTime = selectedRange.endDate / 1000;

        return { endTime, startTime, window: endTime - startTime };
    }

    const window = PRESET_RANGE_WINDOWS[selectedRange.label];
    const endTime = now;

    return {
        endTime,
        startTime: endTime - window,
        window,
    };
};

export const getAllWindowSecs = (
    historicalPoints: GraphDataPoint[],
    historicalRightEdge: number,
) => {
    const oldest = historicalPoints.at(0)?.time;

    if (oldest === undefined) {
        return 31536000;
    }
    const span = Math.ceil(historicalRightEdge - oldest) + ALL_RANGE_WINDOW_BUFFER_SECS;

    return span > 0 ? span : 31536000;
};

export const mergeHistoricalGraphData = ({
    nextPoints,
    previousPoints,
}: {
    nextPoints: GraphDataPoint[];
    previousPoints: GraphDataPoint[];
}) => {
    const pointsByTime = new Map<number, number>();

    previousPoints.forEach(point => {
        pointsByTime.set(point.time, point.value);
    });

    nextPoints.forEach(point => {
        pointsByTime.set(point.time, point.value);
    });

    return Array.from(pointsByTime.entries())
        .map(([time, value]) => ({ time, value }))
        .sort((left, right) => left.time - right.time);
};

export const formatGraphTime = ({
    activeWindow,
    locale,
    time,
}: {
    activeWindow: number;
    locale: string;
    time: number;
}) => {
    const date = new Date(time * 1000);

    if (activeWindow <= 3600) {
        return date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    if (activeWindow <= 86400) {
        return date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    if (activeWindow < 259200) {
        return date.toLocaleString(locale, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    const showYear = activeWindow > 15_552_000;

    return date.toLocaleDateString(locale, {
        year: showYear ? 'numeric' : undefined,
        month: 'short',
        day: 'numeric',
    });
};

export const createGraphFiatFormatter = ({
    currencyCode,
    locale,
}: {
    currencyCode: string;
    locale: string;
}) => {
    const normalizedCurrencyCode = currencyCode.toUpperCase();

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: normalizedCurrencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

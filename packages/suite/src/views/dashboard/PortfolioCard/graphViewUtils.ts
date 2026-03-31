import { type NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';

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
    hour: 3600,
    month: 30 * 24 * 3600,
    week: 7 * 24 * 3600,
    year: 365 * 24 * 3600,
} as const;

const ALL_RANGE_WINDOW_BUFFER_SECS = 24 * 3600;
export const LIVELINE_WINDOW_TRANSITION_MS = 900;
const COINGECKO_COIN_ID_OVERRIDES: Partial<Record<NetworkSymbol, string>> = {
    pol: 'polygon-ecosystem-token',
    bsc: 'binancecoin',
    arb: 'ethereum',
    base: 'ethereum',
    op: 'ethereum',
    avax: 'avalanche-2',
};

export const getCoingeckoCoinId = (symbol: NetworkSymbol): string | undefined =>
    COINGECKO_COIN_ID_OVERRIDES[symbol] ?? getCoingeckoId(symbol);

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
    if (steps.length === 0) {
        return steps;
    }

    const lastStep = steps[steps.length - 1];
    if (lastStep.balance === currentBalance) {
        return steps;
    }

    return [...steps, { time: lastStep.time + 1, balance: currentBalance }];
};

export const balanceAtTime = (steps: BalanceEntry[], time: number): number => {
    if (steps.length === 0) return 0;
    if (time <= steps[0].time) return parseFloat(steps[0].balance);
    if (time >= steps[steps.length - 1].time) return parseFloat(steps[steps.length - 1].balance);

    let lo = 0;
    let hi = steps.length - 1;

    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (steps[mid].time <= time) lo = mid;
        else hi = mid;
    }

    return parseFloat(steps[lo].balance);
};

export const valueAtTime = (points: GraphDataPoint[], time: number): number => {
    if (points.length === 0) {
        return 0;
    }

    if (time <= points[0].time) {
        return points[0].value;
    }

    if (time >= points[points.length - 1].time) {
        return points[points.length - 1].value;
    }

    let lo = 0;
    let hi = points.length - 1;

    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;

        if (points[mid].time <= time) {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    return points[lo].value;
};

export const priceAtTime = (
    points: {
        price: number;
        time: number;
    }[],
    time: number,
): number => {
    if (points.length === 0) {
        return 0;
    }

    if (time <= points[0].time) {
        return points[0].price;
    }

    if (time >= points[points.length - 1].time) {
        return points[points.length - 1].price;
    }

    let lo = 0;
    let hi = points.length - 1;

    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;

        if (points[mid].time <= time) {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    return points[lo].price;
};

export const aggregateBalanceStepSets = (stepSets: BalanceEntry[][]): BalanceEntry[] => {
    const nonEmptyStepSets = stepSets.filter(stepSet => stepSet.length > 0);

    if (nonEmptyStepSets.length === 0) {
        return [];
    }

    // Prepend a zero anchor so balanceAtTime returns 0 before each account's first step.
    const anchoredStepSets = nonEmptyStepSets.map(stepSet => [
        { time: stepSet[0].time - 1, balance: '0' },
        ...stepSet,
    ]);

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

    const earliestBalanceTime = balanceSteps[0].time;
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

export const buildPortfolioSeriesFromCoinSeries = (
    coinSeriesEntries: readonly GraphDataPoint[][],
): GraphDataPoint[] => {
    const nonEmptyCoinSeriesEntries = coinSeriesEntries.filter(points => points.length > 0);

    if (nonEmptyCoinSeriesEntries.length === 0) {
        return [];
    }

    const timeline = Array.from(
        new Set(nonEmptyCoinSeriesEntries.flatMap(points => points.map(point => point.time))),
    ).sort((left, right) => left - right);

    return timeline.map(time => ({
        time,
        value: nonEmptyCoinSeriesEntries.reduce(
            (sum, points) => sum + valueAtTime(points, time),
            0,
        ),
    }));
};

export const getDashboardAlignmentStepSecs = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'hour':
            return 60;
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
}: {
    coinSeriesEntries: readonly GraphDataPoint[][];
    rangeLabel: GraphRange['label'];
}): GraphDataPoint[] => {
    const nonEmptyCoinSeriesEntries = coinSeriesEntries.filter(points => points.length > 0);

    if (nonEmptyCoinSeriesEntries.length === 0) {
        return [];
    }

    const startTime = Math.min(...nonEmptyCoinSeriesEntries.map(points => points[0].time));
    const endTime = Math.max(
        ...nonEmptyCoinSeriesEntries.map(points => points[points.length - 1].time),
    );
    const timeline = buildAlignedTimeline({
        startTime,
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
    `${selectedRange.label}:${selectedRange.startDate?.getTime() ?? 'null'}:${selectedRange.endDate?.getTime() ?? 'null'}`;

export const getRangeBounds = (selectedRange: GraphRange, now: number): RangeBounds | undefined => {
    if (selectedRange.label === 'all') {
        return;
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
    if (historicalPoints.length === 0) {
        return 31536000;
    }

    const oldest = historicalPoints[0].time;
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
    const twoDecimalFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: normalizedCurrencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return {
        format: (value: number) => twoDecimalFormatter.format(value),
    };
};

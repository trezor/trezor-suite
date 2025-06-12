import { format, fromUnixTime } from 'date-fns';

import { ApiData, RawDataItem } from './types';
import { GraphData, GraphRange } from '../../../../../types/wallet/graph';

const getNewValue = (previousValue: number) => {
    const howClose = 0.52 - Math.random();
    const value = Math.floor(previousValue + Math.random() + 15000 * howClose);

    return value > 0 ? value : 0;
};

export const calculateSegments = (raw: RawDataItem[]) => {
    const newSegments: RawDataItem[][] = [];
    const newVerticalSegments: RawDataItem[][] = [];
    let seg: RawDataItem[] = [];

    for (let i = 0; i < raw.length; i++) {
        const cur = raw[i];
        const next = raw[i + 1];

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

    const filteredTicks = raw
        .map(d => d.date)
        .filter((_, i, arr) => i !== 0 && i !== arr.length - 1);

    return { newSegments, newVerticalSegments, filteredTicks };
};

export const calculateMetaData = (data: RawDataItem[]) => {
    const minMax = data.reduce<{ min: number | null; max: number | null }>(
        (acc, item) => {
            if (!item.fiatValue) return acc;
            if (acc.min === null || acc.max === null)
                return { min: item.fiatValue, max: item.fiatValue };

            if (acc.min > item.fiatValue) {
                return { min: item.fiatValue, max: acc.max };
            }
            if (acc.max < item.fiatValue) {
                return { min: acc.min, max: item.fiatValue };
            }

            return acc;
        },
        { min: null, max: null },
    );

    const average = data.reduce((acc, item) => acc + item.value, 0) / data.length;

    return { ...minMax, average };
};

export const dateFormatter = (date: string, isSameYear: boolean) =>
    format(new Date(date), `d MMM${isSameYear ? '' : ' yyyy'}`);

export const sanitizePortfolioData = data =>
    Object.values(data).map(item => ({
        value: parseFloat(item.balanceFiat.usd),
        date: fromUnixTime(item.time).toISOString(),
    }));

const getProbabilityOfTransaction = (selectedRange: GraphRange) => {
    switch (selectedRange.label) {
        case 'all':
            return 0.99;
        case 'two-years':
            return 0.98;
        case 'year':
            return 0.97;
        case 'six-months':
            return 0.95;
        case 'month':
            return 0.8;
        default:
            return 0.9;
    }
};

export const sanitizeCoinData = (data: ApiData, selectedRange: GraphRange): RawDataItem[] => {
    const newArray: RawDataItem[] = [];

    data.prices.forEach(item => {
        const date = new Date(item[0]).toISOString();
        const value = item[1];

        // const probability = getProbabilityOfTransaction(selectedRange);
        // if (Math.random() > probability) {
        //     newArray.push({
        //         date,
        //         value: getNewValue(value),
        //     });
        // }

        newArray.push({
            date,
            value,
        });
    });

    return newArray;
};

export const getBalanceGraphData = (intervalGraphData: GraphData[]): RawDataItem[] => {
    return intervalGraphData.reduce<RawDataItem[]>((acc, data) => {
        if (data.data) {
            const balanceData = data.data.map(d => ({
                date: fromUnixTime(d.time).toISOString(),
                value: parseFloat(d.balance),
            }));

            return [...acc, ...balanceData];
        }

        return acc;
    }, []);
};

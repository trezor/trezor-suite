import { fromUnixTime } from 'date-fns';

import { FiatGraphPoint, FiatGraphPointWithCryptoBalance } from '@suite-common/graph';

export type EnhancedGraphPoint = {
    date: Date;
    originalDate: Date;
    value: FiatGraphPoint['fiatBalance'];
};

export type EnhancedGraphPointWithCryptoBalance = {
    cryptoBalance: string;
} & EnhancedGraphPoint;

export const enhanceGraphPoints = (
    graphPoints: FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[],
): EnhancedGraphPoint[] | EnhancedGraphPointWithCryptoBalance[] =>
    graphPoints.map((point, index) => ({
        value: point.fiatBalance,
        originalDate: fromUnixTime(point.timestamp),
        // @ts-expect-error this is safe, not sure why TS complains
        cryptoBalance: point?.cryptoBalance,
        date: new Date(index),
    }));

/**
 * Graph points and its dates follow each other from the unix epoch
 * (start on 00:00:00 UTC on 1 January 1970) so it is basically index from 0.
 *
 */
const minAndMaxGraphPointArrayItemIndex = (points: EnhancedGraphPoint[]) => {
    let maxValue = points[0].value;
    let maxIndex = 0;
    let minIndex = 0;
    let minValue = points[0].value;

    points.forEach((point, index) => {
        if (point.value > maxValue) {
            maxValue = point.value;
            maxIndex = index;
        }
        if (point.value < minValue) {
            minValue = point.value;
            minIndex = index;
        }
    });
    return {
        maxIndex,
        minIndex,
    };
};

// to prevent 0 % when the first item position is passed here
const getAxisLabelPercentagePosition = (position: number, maxPosition: number) =>
    100 * ((position + 1) / (maxPosition + 1));

export const getExtremaFromGraphPoints = (points: EnhancedGraphPoint[]) => {
    const numberOfPoints = points.length;
    if (numberOfPoints > 0) {
        const { maxIndex, minIndex } = minAndMaxGraphPointArrayItemIndex(points);

        const { value: pointMaxima } = points[maxIndex];
        const { value: pointMinima } = points[minIndex];

        return {
            max: {
                x: getAxisLabelPercentagePosition(maxIndex, numberOfPoints),
                value: pointMaxima,
            },
            min: {
                x: getAxisLabelPercentagePosition(minIndex, numberOfPoints),
                value: pointMinima,
            },
        };
    }
};

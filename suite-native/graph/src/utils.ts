import { FiatGraphPoint } from '@suite-common/graph';

/**
 * Graph points and its dates follow each other from the unix epoch
 * (start on 00:00:00 UTC on 1 January 1970) so it is basically index from 0.
 *
 */
const minAndMaxGraphPointArrayItemIndex = (points: FiatGraphPoint[]) => {
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

export const getExtremaFromGraphPoints = (points: FiatGraphPoint[]) => {
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

export const percentageDiff = (a: number, b: number) => {
    if (a === 0 || b === 0) return 0;

    return 100 * ((b - a) / ((b + a) / 2));
};

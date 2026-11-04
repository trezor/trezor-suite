import { type GraphPoint } from '@suite-native/react-native-graph';

export type GraphExtreme = {
    value: number;
    relativeX: number;
};

export type GraphExtremes = {
    high: GraphExtreme;
    low: GraphExtreme;
};

type ExtremePoints = {
    high: GraphPoint;
    low: GraphPoint;
};

/**
 * Finds the highest and the lowest point of a graph, placed the way the line graph spreads its
 * x axis: by time, between the first and the last point.
 */
export const getGraphExtremes = (points: GraphPoint[]): GraphExtremes | undefined => {
    const firstPoint = points[0];
    const lastPoint = points.at(-1);

    if (firstPoint === undefined || lastPoint === undefined) {
        return undefined;
    }

    const startTime = firstPoint.date.getTime();
    const duration = lastPoint.date.getTime() - startTime;

    // A single point, or points that all share one time, leave no width to place a label along.
    if (duration <= 0) {
        return undefined;
    }

    const { high, low } = points.reduce<ExtremePoints>(
        (extremes, point) => ({
            high: point.value > extremes.high.value ? point : extremes.high,
            low: point.value < extremes.low.value ? point : extremes.low,
        }),
        { high: firstPoint, low: firstPoint },
    );

    const getExtreme = ({ value, date }: GraphPoint): GraphExtreme => ({
        value,
        relativeX: (date.getTime() - startTime) / duration,
    });

    return { high: getExtreme(high), low: getExtreme(low) };
};

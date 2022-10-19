import { LineGraphPoint } from '@suite-common/wallet-graph';

/**
 * Graph points and its dates follow each other from the unix epoch
 * (start on 00:00:00 UTC on 1 January 1970) so it is basically index from 0.
 *
 */
export const maxGraphPointArrayItemIndex = (points: LineGraphPoint[]) =>
    points.reduce(
        (max, point) => (point.value > max ? point.date.getTime() : max),
        points[0].date.getTime(),
    );

export const minGraphPointArrayItemIndex = (points: LineGraphPoint[]) =>
    points.reduce(
        (min, point) => (point.value < min ? point.date.getTime() : min),
        points[0].date.getTime(),
    );

export const getAxisLabelPercentagePosition = (position: number, maxPosition: number) =>
    100 * (position / maxPosition);

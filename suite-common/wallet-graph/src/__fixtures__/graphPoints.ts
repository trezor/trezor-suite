import { LineGraphPoint } from '../types';

export const MIN_GRAPH_POINT_WITH_INVALID_VALUES_VALUE = 2;
export const MAX_GRAPH_POINT_WITH_INVALID_VALUES_VALUE = 102569;

export const graphPointsWithInvalidValues: LineGraphPoint[] = [
    {
        date: new Date('2021-09-03T22:00:00.000Z'),
        value: 1080,
    },
    {
        date: new Date('2022-10-20T16:20:00.000Z'),
        value: 9560,
    },
    {
        date: new Date('2022-10-20T16:35:00.000Z'),
        value: MAX_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
    },
    {
        date: new Date('2022-10-20T16:50:00.000Z'),
        value: MIN_GRAPH_POINT_WITH_INVALID_VALUES_VALUE,
    },
    {
        date: new Date('2022-10-20T17:05:00.000Z'),
        value: 600,
    },
    {
        date: new Date('2022-10-20T17:20:00.000Z'),
        value: 987,
    },
    {
        date: new Date('2022-10-20T17:35:00.000Z'),
        value: 985,
    },
    {
        date: new Date('2022-10-20T17:50:00.000Z'),
        value: 1023,
    },
    {
        date: new Date('2022-10-20T18:05:00.000Z'),
        value: NaN,
    },
    {
        date: new Date('2022-10-20T18:20:00.000Z'),
        value: NaN,
    },
    {
        date: new Date('2022-10-20T18:35:00.000Z'),
        value: 4200,
    },
    {
        date: new Date('2022-10-20T18:50:00.000Z'),
        value: 4800,
    },
    {
        date: new Date('2022-10-20T19:05:00.000Z'),
        value: 4960,
    },
    {
        date: new Date('2022-10-20T19:20:00.000Z'),
        value: 3978,
    },
    {
        date: new Date('2022-10-20T19:35:00.000Z'),
        value: 3500,
    },
    {
        date: new Date('2022-10-20T19:50:00.000Z'),
        value: 4200,
    },
    {
        date: new Date('2022-10-20T20:05:00.000Z'),
        value: 6000,
    },
    {
        date: new Date('2022-10-20T20:20:00.000Z'),
        value: 5478,
    },
    {
        date: new Date('2022-10-20T20:35:00.000Z'),
        value: 5987,
    },
    {
        date: new Date('2022-10-20T20:50:00.000Z'),
        value: 6048,
    },
    {
        date: new Date('2022-10-20T21:05:00.000Z'),
        value: 7000,
    },
    {
        date: new Date('2022-10-20T21:20:00.000Z'),
        value: NaN,
    },
    {
        date: new Date('2022-10-20T21:35:00.000Z'),
        value: 4566,
    },
    {
        date: new Date('2022-10-20T21:50:00.000Z'),
        value: 9654,
    },
    {
        date: new Date('2022-10-20T22:05:00.000Z'),
        value: 8450,
    },
    {
        date: new Date('2022-10-20T22:20:00.000Z'),
        value: 9888,
    },
    {
        date: new Date('2022-10-20T22:35:00.000Z'),
        value: 8745,
    },
    {
        date: new Date('2022-10-20T22:50:00.000Z'),
        value: 6329,
    },
    {
        date: new Date('2022-10-20T23:05:00.000Z'),
        value: 6666,
    },
    {
        date: new Date('2022-10-20T23:20:00.000Z'),
        value: 5754,
    },
    {
        date: new Date('2022-10-20T23:35:00.000Z'),
        value: 250,
    },
    {
        date: new Date('2022-10-20T23:50:00.000Z'),
        value: 2360,
    },
    {
        date: new Date('2022-10-21T00:05:00.000Z'),
        value: 2598,
    },
    {
        date: new Date('2022-10-21T00:20:00.000Z'),
        value: 2458,
    },
    {
        date: new Date('2022-10-21T00:35:00.000Z'),
        value: 2200,
    },
    {
        date: new Date('2022-10-21T00:50:00.000Z'),
        value: 2000,
    },
];

export const graphPointsWithZeroValues: LineGraphPoint[] = [
    {
        date: new Date('2021-09-03T22:00:00.000Z'),
        value: 0,
    },
    {
        date: new Date('2022-10-20T16:20:00.000Z'),
        value: 0,
    },
    {
        date: new Date('2022-10-20T16:35:00.000Z'),
        value: 0,
    },
    {
        date: new Date('2022-10-20T16:50:00.000Z'),
        value: 0,
    },
    {
        date: new Date('2022-10-20T17:05:00.000Z'),
        value: 0,
    },
];

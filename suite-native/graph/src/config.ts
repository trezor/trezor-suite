import { LineGraphTimeFrameItems } from '@suite-common/wallet-types';

export const timeSwitchItems: LineGraphTimeFrameItems = {
    hour: {
        shortcut: '1h',
        value: 'hour',
        stepInMinutes: 5,
        valueBackInMinutes: 60,
    },
    day: {
        shortcut: '1d',
        value: 'day',
        stepInMinutes: 30, // every half hour
        valueBackInMinutes: 1440,
    },
    week: {
        shortcut: '1w',
        value: 'week',
        stepInMinutes: 120, // every 2 hours
        valueBackInMinutes: 10080,
    },
    month: {
        shortcut: '1m',
        value: 'month',
        stepInMinutes: 360, // every 6 hours
        valueBackInMinutes: 43200,
    },
    year: {
        shortcut: '1y',
        value: 'year',
        stepInMinutes: 4320, // every 3 days
        valueBackInMinutes: 525600,
    },
    all: {
        shortcut: 'all',
        value: 'all',
    },
};

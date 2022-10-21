import { LineGraphTimeFrameItems } from './types';

export const lineGraphStepInMinutes = {
    hour: 1, // every minute
    day: 15, // every 15 minutes
    week: 120, // every 2 hours
    month: 360, // every 6 hours
    year: 4320, // every 3 days
};

export const timeSwitchItems: LineGraphTimeFrameItems = {
    hour: {
        shortcut: '1h',
        value: 'hour',
        valueBackInMinutes: 60,
    },
    day: {
        shortcut: '1d',
        value: 'day',
        valueBackInMinutes: 1440,
    },
    week: {
        shortcut: '1w',
        value: 'week',
        valueBackInMinutes: 10080,
    },
    month: {
        shortcut: '1m',
        value: 'month',
        valueBackInMinutes: 43200,
    },
    year: {
        shortcut: '1y',
        value: 'year',
        valueBackInMinutes: 525600,
    },
    all: {
        shortcut: 'all',
        value: 'all',
    },
};

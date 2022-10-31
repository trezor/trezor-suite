import { LineGraphTimeFrameItems } from './types';

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

import { LineGraphTimeFrameItems } from '@suite-common/wallet-types';
import { lineGraphStepInMinutes } from '@suite-common/wallet-constants';

export const timeSwitchItems: LineGraphTimeFrameItems = {
    hour: {
        shortcut: '1h',
        value: 'hour',
        stepInMinutes: lineGraphStepInMinutes.hour,
        valueBackInMinutes: 60,
    },
    day: {
        shortcut: '1d',
        value: 'day',
        stepInMinutes: lineGraphStepInMinutes.day,
        valueBackInMinutes: 1440,
    },
    week: {
        shortcut: '1w',
        value: 'week',
        stepInMinutes: lineGraphStepInMinutes.week,
        valueBackInMinutes: 10080,
    },
    month: {
        shortcut: '1m',
        value: 'month',
        stepInMinutes: lineGraphStepInMinutes.month,
        valueBackInMinutes: 43200,
    },
    year: {
        shortcut: '1y',
        value: 'year',
        stepInMinutes: lineGraphStepInMinutes.year,
        valueBackInMinutes: 525600,
    },
    all: {
        shortcut: 'all',
        value: 'all',
    },
};

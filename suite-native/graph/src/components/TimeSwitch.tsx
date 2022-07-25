import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

import { TimeFrameItems } from '../reducers/types';
import { TimeSwitchItem } from './TimeSwitchItem';

const timeSwitchItems: TimeFrameItems = {
    hour: {
        shortcut: 'h',
        value: 'hour',
    },
    day: {
        shortcut: 'd',
        value: 'day',
    },
    week: {
        shortcut: 'w',
        value: 'week',
    },
    month: {
        shortcut: 'm',
        value: 'month',
    },
    year: {
        shortcut: 'y',
        value: 'year',
    },
};

const timeSwitchStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

export const TimeSwitch = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(timeSwitchStyle)}>
            {Object.values(timeSwitchItems).map(item => (
                <TimeSwitchItem key={item.value} shortcut={item.shortcut} value={item.value} />
            ))}
        </Box>
    );
};

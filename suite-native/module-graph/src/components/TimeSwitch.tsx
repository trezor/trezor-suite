import React, { useState } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

import { TimeFrameItems, TimeFrameValues } from '../types';
import { TimeSwitchItem } from './TimeSwitchItem';

type TimeSwitchProps = {
    defaultTimeFrame?: TimeFrameValues;
};

export const timeSwitchItems: TimeFrameItems = {
    hour: {
        shortcut: '1h',
        value: 'hour',
    },
    day: {
        shortcut: '1d',
        value: 'day',
    },
    week: {
        shortcut: '1w',
        value: 'week',
    },
    month: {
        shortcut: '1m',
        value: 'month',
    },
    year: {
        shortcut: '1y',
        value: 'year',
    },
    all: {
        shortcut: 'all',
        value: 'all',
    },
};

const timeSwitchStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'space-around',
}));

export const TimeSwitch = ({ defaultTimeFrame = 'day' }: TimeSwitchProps) => {
    const { applyStyle } = useNativeStyles();
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrameValues>(defaultTimeFrame);

    const handleSelectTimeFrame = (timeFrame: TimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    };

    return (
        <Box style={applyStyle(timeSwitchStyle)}>
            {Object.values(timeSwitchItems).map(item => (
                <TimeSwitchItem
                    key={item.value}
                    shortcut={item.shortcut}
                    value={item.value}
                    onSelectTimeFrame={handleSelectTimeFrame}
                    selectedTimeFrame={selectedTimeFrame}
                />
            ))}
        </Box>
    );
};

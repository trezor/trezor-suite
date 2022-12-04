import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

import { TimeSwitchItem, TimeSwitchValue } from './TimeSwitchItem';

type TimeSwitchProps = {
    selectedTimeFrame: TimeSwitchValue;
    onSelectTimeFrame: (valueBackInHours: TimeSwitchValue) => void;
};

type TimeSwitchItemType = {
    valueBackInHours: TimeSwitchValue;
    label: string;
};

const timeSwitchItems: TimeSwitchItemType[] = [
    { label: '1h', valueBackInHours: 1 },
    { label: '1d', valueBackInHours: 24 },
    { label: '1w', valueBackInHours: 168 },
    { label: '1m', valueBackInHours: 720 },
    { label: '1y', valueBackInHours: 8760 },
    { label: 'all', valueBackInHours: null },
];

const timeSwitchStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'space-around',
}));

export const TimeSwitch = ({ selectedTimeFrame = 1, onSelectTimeFrame }: TimeSwitchProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(timeSwitchStyle)}>
            {timeSwitchItems.map(item => (
                <TimeSwitchItem
                    key={item.label}
                    shortcut={item.label}
                    value={item.valueBackInHours}
                    onSelectTimeFrame={onSelectTimeFrame}
                    selectedTimeFrame={selectedTimeFrame}
                />
            ))}
        </Box>
    );
};

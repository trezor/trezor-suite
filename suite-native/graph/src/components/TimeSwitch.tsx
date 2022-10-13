import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';
import { LineGraphTimeFrameValues } from '@suite-common/wallet-types';

import { TimeSwitchItem } from './TimeSwitchItem';
import { timeSwitchItems } from '../config';

type TimeSwitchProps = {
    selectedTimeFrame: LineGraphTimeFrameValues;
    onSelectTimeFrame: (timeFrame: LineGraphTimeFrameValues) => void;
};

const timeSwitchStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'space-around',
}));

export const TimeSwitch = ({ selectedTimeFrame = 'day', onSelectTimeFrame }: TimeSwitchProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(timeSwitchStyle)}>
            {Object.values(timeSwitchItems).map(item => (
                <TimeSwitchItem
                    key={item.value}
                    shortcut={item.shortcut}
                    value={item.value}
                    onSelectTimeFrame={onSelectTimeFrame}
                    selectedTimeFrame={selectedTimeFrame}
                />
            ))}
        </Box>
    );
};

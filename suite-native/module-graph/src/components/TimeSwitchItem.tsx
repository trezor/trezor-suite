import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TimeFrameValues } from '../types';

type TimeSwitchItemProps = {
    value: TimeFrameValues;
    shortcut: string;
};

type TextStyleProps = {
    isSelected: boolean;
};
const textStyle = prepareNativeStyle<TextStyleProps>((utils, { isSelected }) => ({
    ...utils.typography.hint,
    color: isSelected ? utils.colors.forest : utils.colors.gray500,
    textTransform: 'uppercase',
}));

const switchItemStyle = prepareNativeStyle(utils => ({
    flex: 1,
    alignItems: 'center',
    paddingVertical: utils.spacings.small,
}));

export const TimeSwitchItem = ({ value, shortcut }: TimeSwitchItemProps) => {
    const { applyStyle } = useNativeStyles();
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrameValues>('day');

    const handleSelectTimeFrame = (timeFrame: TimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    };

    return (
        <TouchableOpacity
            onPress={() => handleSelectTimeFrame(value)}
            testID={`TimeSwitchItem_${value}`}
            style={applyStyle(switchItemStyle)}
        >
            <Text
                style={applyStyle(textStyle, {
                    isSelected: selectedTimeFrame === value,
                })}
            >
                {shortcut}
            </Text>
        </TouchableOpacity>
    );
};

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { getSelectedTimeFrame, setSelectedTimeFrame } from '../slice';
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

export const TimeSwitchItem = ({ value, shortcut }: TimeSwitchItemProps) => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const selectedTimeFrame = useSelector(getSelectedTimeFrame);

    const handleSelectTimeFrame = (timeFrame: TimeFrameValues) => {
        dispatch(setSelectedTimeFrame(timeFrame));
    };

    return (
        <TouchableOpacity onPress={() => handleSelectTimeFrame(value)}>
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

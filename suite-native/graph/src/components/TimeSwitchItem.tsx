import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { LineGraphTimeFrameValues } from '@suite-common/wallet-graph';

type TimeSwitchItemProps = {
    value: LineGraphTimeFrameValues;
    shortcut: string;
    selectedTimeFrame: LineGraphTimeFrameValues;
    onSelectTimeFrame: (timeFrame: LineGraphTimeFrameValues) => void;
};

type ItemStyleProps = {
    isSelected: boolean;
};
const textStyle = prepareNativeStyle<ItemStyleProps>((utils, { isSelected }) => ({
    ...utils.typography.hint,
    color: isSelected ? utils.colors.forest : utils.colors.gray500,
    textTransform: 'uppercase',
}));

const switchItemStyle = prepareNativeStyle<ItemStyleProps>((utils, { isSelected }) => ({
    flex: 1,
    alignItems: 'center',
    paddingVertical: utils.spacings.small,
    paddingHorizontal: utils.spacings.medium,
    extend: {
        condition: isSelected,
        style: {
            backgroundColor: utils.colors.gray0,
            borderRadius: utils.borders.radii.round,
        },
    },
}));

export const TimeSwitchItem = ({
    value,
    shortcut,
    onSelectTimeFrame,
    selectedTimeFrame,
}: TimeSwitchItemProps) => {
    const { applyStyle } = useNativeStyles();

    const isSelected = selectedTimeFrame === value;

    return (
        <TouchableOpacity
            onPress={() => onSelectTimeFrame(value)}
            testID={`TimeSwitchItem_${value}`}
            style={applyStyle(switchItemStyle, { isSelected })}
        >
            <Text style={applyStyle(textStyle, { isSelected })}>{shortcut}</Text>
        </TouchableOpacity>
    );
};

import { TouchableOpacity } from 'react-native';

import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type TimeSwitchValue = number | null;

type TimeSwitchItemProps = {
    value: TimeSwitchValue;
    shortcut: string;
    selectedTimeFrame: TimeSwitchValue;
    onSelectTimeFrame: (valueBackInHours: TimeSwitchValue) => void;
};

type ItemStyleProps = {
    isSelected: boolean;
};
const textStyle = prepareNativeStyle<ItemStyleProps>((utils, { isSelected }) => ({
    color: isSelected ? utils.colors.textPrimaryDefault : utils.colors.textSubdued,
    textTransform: 'uppercase',
}));

const switchItemStyle = prepareNativeStyle<ItemStyleProps>((utils, { isSelected }) => ({
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    extend: {
        condition: isSelected,
        style: {
            backgroundColor: utils.colors.backgroundSurfaceElevation1,
            borderRadius: utils.borders.radii.round,
            ...utils.boxShadows.s,
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
            <Text variant="hint" style={applyStyle(textStyle, { isSelected })}>
                {shortcut}
            </Text>
        </TouchableOpacity>
    );
};

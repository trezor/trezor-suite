import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { G } from '@mobily/ts-belt';

import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Text } from '../Text';

type SelectTriggerProps = {
    value: string | null;
    label: string;
    icon: ReactNode;
    handlePress: () => void;
    valueLabel?: string;
};

const SELECT_HEIGHT = 58 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const selectStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    borderWidth: utils.borders.widths.s,
    borderRadius: utils.borders.radii.s,
    borderColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    color: utils.colors.textSubdued,
    paddingLeft: 12,
    paddingRight: 23.25,
    height: SELECT_HEIGHT,
}));

const iconWrapperStyle = prepareNativeStyle(() => ({ marginRight: 1 }));

export const SelectTrigger = ({
    value,
    label,
    icon,
    valueLabel,
    handlePress,
}: SelectTriggerProps) => {
    const { applyStyle } = useNativeStyles();

    const formattedValue = !G.isNullable(valueLabel) ? `${valueLabel} · ${value}` : value;

    return (
        <TouchableOpacity onPress={handlePress} style={applyStyle(selectStyle)}>
            <Box>
                {!!value && (
                    <Text variant="label" color="textSubdued">
                        {label}
                    </Text>
                )}
                <Box flexDirection="row" alignItems="center">
                    <Text numberOfLines={1}>
                        {icon && <Box style={applyStyle(iconWrapperStyle)}>{icon}</Box>}
                        <Text numberOfLines={1} ellipsizeMode="tail">
                            {formattedValue ?? label}
                        </Text>
                    </Text>
                </Box>
            </Box>
            <Icon size="large" color="iconSubdued" name="chevronDown" />
        </TouchableOpacity>
    );
};

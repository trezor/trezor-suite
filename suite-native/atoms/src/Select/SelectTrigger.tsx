import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';

type SelectTriggerProps = {
    value: string | null;
    label: string;
    icon: ReactNode;
    handlePress: () => void;
    valueLabel?: string;
};

const selectStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: utils.colors.gray200,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.small,
    borderColor: utils.colors.gray200,
    color: utils.colors.gray600,
    paddingLeft: 12,
    paddingRight: 23.25,
    height: 58,
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

    return (
        <TouchableOpacity onPress={handlePress} style={applyStyle(selectStyle)}>
            <Box>
                {!!value && (
                    <Text variant="label" color="gray600">
                        {label}
                    </Text>
                )}
                <Box flexDirection="row" alignItems="center">
                    {!!value && (
                        <>
                            <Box style={applyStyle(iconWrapperStyle)}>{icon}</Box>
                            <Text color="gray700">{valueLabel} · </Text>
                        </>
                    )}
                    <Text color="gray700" numberOfLines={1}>
                        {value ?? label}
                    </Text>
                </Box>
            </Box>
            <Icon size="medium" color="gray600" name="chevronDown" />
        </TouchableOpacity>
    );
};

import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { G } from '@mobily/ts-belt';

import { Icon } from '@suite-common/icons';
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
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.small,
    borderColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    color: utils.colors.textSubdued,
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

    const shouldDisplaySeparator = !G.isNull(value) && !G.isUndefined(valueLabel);

    return (
        <TouchableOpacity onPress={handlePress} style={applyStyle(selectStyle)}>
            <Box>
                {!!value && (
                    <Text variant="label" color="textSubdued">
                        {label}
                    </Text>
                )}
                <Box flexDirection="row" alignItems="center">
                    {shouldDisplaySeparator && (
                        <>
                            <Box style={applyStyle(iconWrapperStyle)}>{icon}</Box>
                            <Text>{valueLabel} · </Text>
                        </>
                    )}
                    <Text numberOfLines={1}>{value ?? label}</Text>
                </Box>
            </Box>
            <Icon size="large" color="iconSubdued" name="chevronDown" />
        </TouchableOpacity>
    );
};

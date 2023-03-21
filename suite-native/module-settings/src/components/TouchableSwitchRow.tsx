import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text, Switch } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TouchableSwitchRowProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    text: string;
    description?: string;
    iconName: IconName;
};

const iconWrapperStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    padding: utils.spacings.medium,
}));

export const TouchableSwitchRow = ({
    isChecked,
    onChange,
    text,
    description,
    iconName,
}: TouchableSwitchRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity onPress={() => onChange(!isChecked)}>
            <Box flexDirection="row" justifyContent="space-between" marginVertical="medium">
                <Box style={applyStyle(iconWrapperStyle)}>
                    <Icon name={iconName} />
                </Box>
                <Box style={{ maxWidth: '80%' }}>
                    <Text>{text}</Text>
                    {description && (
                        <Text variant="hint" color="textSubdued">
                            {description}
                        </Text>
                    )}
                </Box>
                <Switch isChecked={isChecked} onChange={onChange} />
            </Box>
        </TouchableOpacity>
    );
};

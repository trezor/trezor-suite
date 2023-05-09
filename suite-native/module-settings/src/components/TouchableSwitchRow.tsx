import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text, Switch } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TouchableSwitchRowProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    text: string;
    description?: ReactNode;
    iconName: IconName;
};

const textStyle = prepareNativeStyle(_ => ({
    marginLeft: 12,
}));

const contentStyle = prepareNativeStyle(_ => ({
    maxWidth: '70%',
}));

const ICON_SIZE = 48;
const iconWrapperStyle = prepareNativeStyle(utils => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
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

    const handleChange = () => {
        onChange(!isChecked);
    };

    return (
        <TouchableOpacity onPress={handleChange}>
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="flex-start"
                marginVertical="medium"
            >
                <Box style={applyStyle(contentStyle)} flexDirection="row">
                    <Box style={applyStyle(iconWrapperStyle)}>
                        <Icon color="iconSubdued" name={iconName} />
                    </Box>
                    <Box alignItems="flex-start" style={applyStyle(textStyle)}>
                        <Text>{text}</Text>
                        {description && <Box>{description}</Box>}
                    </Box>
                </Box>
                <Switch isChecked={isChecked} onChange={handleChange} />
            </Box>
        </TouchableOpacity>
    );
};

import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text, Switch, RoundedIcon } from '@suite-native/atoms';
import { IconName } from '@trezor/icons';
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
                    <Box padding="medium">
                        <RoundedIcon
                            name={iconName}
                            iconColor="iconSubdued"
                            backgroundColor="backgroundSurfaceElevation0"
                        />
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

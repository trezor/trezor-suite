import React from 'react';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '../Box';
import { Text } from '../Text';
import { Icon, IconName } from '@trezor/icons';

type ActionIconButtonProps = {
    iconName: IconName;
    title: string;
    onPress: () => void;
};

const rectangleButtonStyle = prepareNativeStyle(utils => ({
    height: 79,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: utils.borders.radii.small,
    backgroundColor: utils.colors.gray300,
    margin: utils.spacings.small,
    flex: 1,
}));

export const ActionIconButton = ({ iconName, title, onPress }: ActionIconButtonProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <TouchableOpacity style={applyStyle(rectangleButtonStyle)} onPress={onPress}>
            <Box justifyContent="center" alignItems="center">
                <Icon name={iconName} />
                <Text variant="label">{title.toUpperCase()}</Text>
            </Box>
        </TouchableOpacity>
    );
};

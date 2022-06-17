import React from 'react';
import { TouchableOpacity } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '../Box';
import { Text } from '../Text';
import { Icon, IconName } from '@trezor/icons';

type ActionIconButtonProps = {
    iconName: IconName;
    title: string;
    onPress: () => void;
    style?: NativeStyleObject;
};

const rectangleButtonStyle = prepareNativeStyle(utils => ({
    height: 79,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: utils.borders.radii.small,
    backgroundColor: utils.colors.gray300,
    flex: 1,
}));

export const TileButton = ({ iconName, title, onPress, style }: ActionIconButtonProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <TouchableOpacity style={[applyStyle(rectangleButtonStyle), style]} onPress={onPress}>
            <Box justifyContent="center" alignItems="center">
                <Icon name={iconName} />
                <Text variant="label">{title.toUpperCase()}</Text>
            </Box>
        </TouchableOpacity>
    );
};

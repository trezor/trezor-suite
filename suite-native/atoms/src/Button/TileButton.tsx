import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon, IconName } from '@trezor/icons';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';

type TileButtonProps = {
    iconName: IconName;
    title: string;
    onPress: () => void;
    style?: NativeStyleObject;
    isDisabled?: boolean;
};

type TileButtonStyleProps = {
    isDisabled: boolean;
};

const tileButtonStyle = prepareNativeStyle<TileButtonStyleProps>(utils => ({
    height: 79,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: utils.borders.radii.small,
    backgroundColor: utils.colors.gray300,
    flex: 1,
}));

const iconWrapperStyle = prepareNativeStyle(() => ({
    marginBottom: 5,
}));

const textStyle = prepareNativeStyle(() => ({
    textTransform: 'uppercase',
}));

export const TileButton = ({
    iconName,
    title,
    onPress,
    style,
    isDisabled = false,
}: TileButtonProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <TouchableOpacity
            disabled={isDisabled}
            style={[applyStyle(tileButtonStyle, { isDisabled }), style]}
            onPress={onPress}
        >
            <Box justifyContent="center" alignItems="center">
                <Box style={applyStyle(iconWrapperStyle)}>
                    <Icon name={iconName} />
                </Box>
                <Text variant="label" style={applyStyle(textStyle)}>
                    {title}
                </Text>
            </Box>
        </TouchableOpacity>
    );
};

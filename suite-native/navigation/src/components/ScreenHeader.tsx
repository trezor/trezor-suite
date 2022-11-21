import React, { ReactNode } from 'react';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { IconButton, Text } from '@suite-native/atoms';

type ScreenHeaderWithIconsProps = {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    titleComponent?: ReactNode;
    title?: string; // Title has higher priority than title component.
    style?: NativeStyleObject;
    hasGoBackIcon?: boolean;
};

const ICON_SIZE = 48;

const screenHeaderStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ICON_SIZE,
}));

const iconWrapperStyle = prepareNativeStyle(() => ({
    width: ICON_SIZE,
    height: ICON_SIZE,
}));

const GoBackIcon = () => {
    const navigation = useNavigation();
    return (
        <IconButton
            iconName="chevronLeft"
            size="large"
            colorScheme="gray"
            onPress={() => navigation.goBack()}
            isRounded
        />
    );
};

export const ScreenHeader = ({
    leftIcon,
    rightIcon,
    titleComponent,
    style,
    title,
    hasGoBackIcon = true,
}: ScreenHeaderWithIconsProps) => {
    const { applyStyle } = useNativeStyles();

    const shouldDisplayGoBackButton = hasGoBackIcon && !leftIcon;

    return (
        <View style={[applyStyle(screenHeaderStyle), style]}>
            {shouldDisplayGoBackButton ? (
                <GoBackIcon />
            ) : (
                <View style={applyStyle(iconWrapperStyle)}>{leftIcon}</View>
            )}
            {title ? <Text variant="titleSmall">{title}</Text> : titleComponent}
            <View style={applyStyle(iconWrapperStyle)}>{rightIcon}</View>
        </View>
    );
};

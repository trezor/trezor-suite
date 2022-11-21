import React, { ReactNode } from 'react';
import { View } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ScreenHeaderWithIconsProps = {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    children: ReactNode;
    style?: NativeStyleObject;
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

export const ScreenHeaderWithIcons = ({
    leftIcon,
    rightIcon,
    children,
    style,
}: ScreenHeaderWithIconsProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(screenHeaderStyle), style]}>
            <View style={applyStyle(iconWrapperStyle)}>{leftIcon}</View>
            {children}
            <View style={applyStyle(iconWrapperStyle)}>{rightIcon}</View>
        </View>
    );
};

import React, { ReactNode } from 'react';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { IconButton, StepsProgressBar, Text } from '@suite-native/atoms';

type ScreenHeaderWithIconsProps = {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    title?: string;
    style?: NativeStyleObject;
    hasGoBackIcon?: boolean;
    numberOfSteps?: number;
    activeStep?: number;
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

const progressBarWrapperStyle = prepareNativeStyle(() => ({
    height: ICON_SIZE,
    alignItems: 'center',
    paddingTop: 7,
    justifyContent: 'space-between',
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
    style,
    title,
    numberOfSteps,
    activeStep,
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
            {activeStep && numberOfSteps ? (
                <View style={applyStyle(progressBarWrapperStyle)}>
                    <StepsProgressBar numberOfSteps={numberOfSteps} activeStep={activeStep} />
                    {title && <Text variant="titleSmall">{title}</Text>}
                </View>
            ) : (
                <>{title && <Text variant="titleSmall">{title}</Text>}</>
            )}

            <View style={applyStyle(iconWrapperStyle)}>{rightIcon}</View>
        </View>
    );
};

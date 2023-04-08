import React, { ReactNode } from 'react';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, IconButton, StepsProgressBar, Text } from '@suite-native/atoms';
import { TypographyStyle } from '@trezor/theme';

type ScreenHeaderWithIconsProps = {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    title?: string;
    style?: NativeStyleObject;
    hasGoBackIcon?: boolean;
    numberOfSteps?: number;
    activeStep?: number;
    titleVariant?: TypographyStyle;
};

const ICON_SIZE = 48;

const screenHeaderStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ICON_SIZE,
    marginHorizontal: utils.spacings.small,
}));

const iconWrapperStyle = prepareNativeStyle(() => ({
    width: ICON_SIZE,
    height: ICON_SIZE,
}));

const progressBarWrapperStyle = prepareNativeStyle(utils => ({
    height: ICON_SIZE,
    alignItems: 'center',
    paddingTop: utils.spacings.small,
    justifyContent: 'space-between',
}));

const GoBackIcon = () => {
    const navigation = useNavigation();
    return (
        <IconButton
            iconName="chevronLeft"
            size="medium"
            colorScheme="tertiaryElevation0"
            onPress={() => navigation.goBack()}
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
    titleVariant = 'titleSmall',
    hasGoBackIcon = true,
}: ScreenHeaderWithIconsProps) => {
    const { applyStyle } = useNativeStyles();

    const shouldDisplayGoBackButton = hasGoBackIcon && !leftIcon;

    return (
        <View style={[applyStyle(screenHeaderStyle), style]}>
            <View style={applyStyle(iconWrapperStyle)}>
                {shouldDisplayGoBackButton ? <GoBackIcon /> : leftIcon}
            </View>
            <Box flex={1} marginHorizontal="large" alignItems="center">
                {activeStep && numberOfSteps ? (
                    <View style={applyStyle(progressBarWrapperStyle)}>
                        <StepsProgressBar numberOfSteps={numberOfSteps} activeStep={activeStep} />
                        {title && <Text variant={titleVariant}>{title}</Text>}
                    </View>
                ) : (
                    <Text variant={titleVariant} numberOfLines={1} ellipsizeMode="tail">
                        {title}
                    </Text>
                )}
            </Box>

            <View style={applyStyle(iconWrapperStyle)}>{rightIcon}</View>
        </View>
    );
};

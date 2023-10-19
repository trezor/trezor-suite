import { ReactNode } from 'react';
import { View } from 'react-native';

import { RequireAllOrNone } from 'type-fest';
import { useNavigation } from '@react-navigation/native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, IconButton, StepsProgressBar, Text, VStack } from '@suite-native/atoms';
import { TypographyStyle } from '@trezor/theme';

type ScreenHeaderWithIconsProps = {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    content?: string | ReactNode;
    style?: NativeStyleObject;
    hasGoBackIcon?: boolean;
    titleVariant?: TypographyStyle;
} & RequireAllOrNone<
    { numberOfSteps?: number; activeStep?: number },
    'activeStep' | 'numberOfSteps'
>;

const ICON_SIZE = 48;

const screenHeaderStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ICON_SIZE,
    marginHorizontal: utils.spacings.medium,
}));

const iconWrapperStyle = prepareNativeStyle(() => ({
    width: ICON_SIZE,
    height: ICON_SIZE,
}));

const headerContentStyle = prepareNativeStyle(_ => ({
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
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
    content,
    numberOfSteps,
    activeStep,
    titleVariant = 'titleSmall',
    hasGoBackIcon = true,
}: ScreenHeaderWithIconsProps) => {
    const { applyStyle } = useNativeStyles();

    const LeftIcon = hasGoBackIcon && !leftIcon ? <GoBackIcon /> : leftIcon;
    const isStepperDisplayed = activeStep && numberOfSteps;

    return (
        <View style={[applyStyle(screenHeaderStyle), style]}>
            <View style={applyStyle(iconWrapperStyle)}>{LeftIcon}</View>
            <Box flex={1} marginHorizontal="large" alignItems="center">
                <VStack style={applyStyle(headerContentStyle)} spacing="small">
                    {isStepperDisplayed && (
                        <StepsProgressBar numberOfSteps={numberOfSteps} activeStep={activeStep} />
                    )}
                    {typeof content === 'string' ? (
                        <Text variant={titleVariant} adjustsFontSizeToFit numberOfLines={1}>
                            {content}
                        </Text>
                    ) : (
                        content
                    )}
                </VStack>
            </Box>

            <View style={applyStyle(iconWrapperStyle)}>{rightIcon}</View>
        </View>
    );
};

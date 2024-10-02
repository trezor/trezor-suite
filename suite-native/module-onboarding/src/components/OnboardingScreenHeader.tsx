import { ReactNode } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, StepsProgressBar, Text } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

type OnboardingScreenHeaderProps = {
    title: ReactNode;
    subtitle?: ReactNode;
    activeStep: number;
};

const titleStyle = prepareNativeStyle(utils => ({
    textAlign: 'center',
    marginBottom: utils.spacings.sp12,
}));

const wrapperStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingTop: utils.spacings.sp32,
}));

const subtitleStyle = prepareNativeStyle(() => ({
    textAlign: 'center',
    minHeight: 73,
}));

export const OnboardingScreenHeader = ({
    title,
    subtitle,
    activeStep,
}: OnboardingScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    return (
        <Box alignItems="center" style={applyStyle(wrapperStyle)} alignSelf="center">
            <Box marginBottom="sp32">
                <StepsProgressBar
                    numberOfSteps={isUsbDeviceConnectFeatureEnabled ? 3 : 2}
                    activeStep={activeStep}
                />
            </Box>
            <Text variant="titleMedium" style={applyStyle(titleStyle)}>
                {title}
            </Text>
            {subtitle && (
                <Text color="textSubdued" style={applyStyle(subtitleStyle)}>
                    {subtitle}
                </Text>
            )}
        </Box>
    );
};

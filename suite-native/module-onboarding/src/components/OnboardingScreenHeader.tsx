import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, StepsProgressBar, Text } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

type OnboardingScreenHeaderProps = {
    title: string;
    subtitle?: string;
    activeStep: number;
};

const titleStyle = prepareNativeStyle(() => ({
    textAlign: 'center',
    marginBottom: 12,
}));

const wrapperStyle = prepareNativeStyle(() => ({
    paddingHorizontal: 16,
    paddingTop: 32,
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
            <Box marginBottom="extraLarge">
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

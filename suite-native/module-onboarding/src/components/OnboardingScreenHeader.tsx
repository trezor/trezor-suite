import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, StepsProgressBar, Text } from '@suite-native/atoms';

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
    width: '80%',
}));

const subtitleStyle = prepareNativeStyle(() => ({
    textAlign: 'center',
}));

export const OnboardingScreenHeader = ({
    title,
    subtitle,
    activeStep,
}: OnboardingScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box alignItems="center" style={applyStyle(wrapperStyle)} alignSelf="center">
            <Box marginBottom="extraLarge">
                <StepsProgressBar numberOfSteps={4} activeStep={activeStep} />
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

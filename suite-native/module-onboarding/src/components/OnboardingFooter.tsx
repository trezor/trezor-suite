import { useDispatch, useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { Box, Button, Stack, Text } from '@suite-native/atoms';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { OnboardingStackRoutes } from '@suite-native/navigation';
import { setIsOnboardingFinished } from '@suite-native/module-settings';
import { selectHasUserAllowedTracking } from '@suite-common/analytics';
import { analytics, EventType } from '@suite-native/analytics';

const wrapperStyle = prepareNativeStyle(() => ({
    width: '90%',
}));

type OnboardingFooterProps = {
    redirectTarget: () => void;
    isLastStep?: boolean;
};

const reportAnalyticsOnboardingCompleted = (isTrackingAllowed: boolean) => {
    // For users who have not allowed tracking, enable analytics just for reporting
    // the OnboardingCompleted event and then disable it again.
    if (!isTrackingAllowed) analytics.enable();
    analytics.report({
        type: EventType.OnboardingCompleted,
        payload: { analyticsPermission: isTrackingAllowed },
    });
    if (!isTrackingAllowed) analytics.disable();
};

export const OnboardingFooter = ({ redirectTarget, isLastStep = false }: OnboardingFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute();
    const dispatch = useDispatch();
    const userHasAllowedTracking = useSelector(selectHasUserAllowedTracking);

    const buttonTitle = route.name === OnboardingStackRoutes.Welcome ? 'Get started' : 'Next';
    const handlePress = () => {
        if (isLastStep) {
            dispatch(setIsOnboardingFinished());
            reportAnalyticsOnboardingCompleted(userHasAllowedTracking);
        }
        redirectTarget();
    };

    return (
        <Stack spacing="large" style={applyStyle(wrapperStyle)}>
            <Box flexDirection="row" alignItems="center" justifyContent="center">
                <Text variant="hint" textAlign="center">
                    Don’t have a Trezor? <Link href="https://trezor.io/" label="Get one here." />
                </Text>
            </Box>
            <Button size="large" testID={`@onboarding/${route.name}/nextBtn`} onPress={handlePress}>
                {buttonTitle}
            </Button>
        </Stack>
    );
};

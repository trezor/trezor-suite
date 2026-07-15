import { ImageBackground, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Box, Button, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { setIsOnboardingFeedbackBannerEnabled } from '@suite-native/banner-flags';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const ONBOARDING_FEEDBACK_SURVEY_URL = 'https://satoshilabs.typeform.com/to/fsiLqgmd';

const BANNER_HEIGHT = 160;

const containerStyle = prepareNativeStyle(utils => ({
    height: BANNER_HEIGHT,
    padding: utils.spacings.sp12,
    borderRadius: utils.borders.radii.r16,
    overflow: 'hidden',
}));

const overlayStyle = prepareNativeStyle(() => ({
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    opacity: 0.1,
}));

export const OnboardingFeedbackBanner = () => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const openLink = useOpenLink();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const reportAnalyticsBannerAction = (action: 'cta' | 'close') => {
        analytics.report({
            type: events.onboardingFeedbackBannerClickedEvent.name,
            payload: { platform: 'mobile', origin: 'postOnboardingDashboard', action },
        });
    };

    const handleGiveFeedback = () => {
        reportAnalyticsBannerAction('cta');
        openLink(ONBOARDING_FEEDBACK_SURVEY_URL, { enforce: true });
        dispatch(setIsOnboardingFeedbackBannerEnabled(false));
    };

    const handleClose = () => {
        reportAnalyticsBannerAction('close');
        dispatch(setIsOnboardingFeedbackBannerEnabled(false));
    };

    return (
        <ImageBackground
            source={require('../../../assets/onboardingSurveyBannerBackground.webp')}
            resizeMode="cover"
            style={applyStyle(containerStyle)}
            fadeDuration={0}
        >
            <Box style={applyStyle(overlayStyle)} />
            <HStack flex={1}>
                <VStack flex={1} justifyContent="space-between" paddingTop="sp4">
                    <Box>
                        <Text variant="headline-sm" color="contentOnDarkPrimary">
                            <Translation id="moduleHome.emptyState.onboardingFeedbackBanner.title" />
                        </Text>
                        <Text variant="body-sm" color="contentOnDarkNeutral">
                            <Translation id="moduleHome.emptyState.onboardingFeedbackBanner.subtitle" />
                        </Text>
                    </Box>
                    <HStack>
                        <Button
                            size="medium"
                            intent="neutral"
                            onPress={handleGiveFeedback}
                            testID="@home/onboarding-feedback-banner/give-feedback"
                            iconRight="arrowLineUpRight"
                        >
                            <Translation id="moduleHome.emptyState.onboardingFeedbackBanner.button" />
                        </Button>
                    </HStack>
                </VStack>
                <Box>
                    <IconButton
                        iconName="x"
                        size="medium"
                        intent="neutral"
                        priority="secondary"
                        isInverse
                        onPress={handleClose}
                        testID="@home/onboarding-feedback-banner/close"
                    />
                </Box>
            </HStack>
        </ImageBackground>
    );
};

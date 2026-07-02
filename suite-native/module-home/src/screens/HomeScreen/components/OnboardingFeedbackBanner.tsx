import { ImageBackground } from 'react-native';
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
    borderRadius: utils.borders.radii.r16,
    paddingLeft: utils.spacings.sp16,
    paddingTop: utils.spacings.sp12,
    paddingRight: utils.spacings.sp12,
    paddingBottom: utils.spacings.sp16,
    overflow: 'hidden',
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
            <HStack flex={1}>
                <VStack flex={1} justifyContent="space-between" paddingTop="sp4">
                    <VStack spacing="sp4">
                        <Text variant="headline-sm" color="contentOnDarkPrimary">
                            <Translation id="moduleHome.emptyState.onboardingFeedbackBanner.title" />
                        </Text>
                        <Text variant="body-md" color="contentOnDarkNeutral">
                            <Translation id="moduleHome.emptyState.onboardingFeedbackBanner.subtitle" />
                        </Text>
                    </VStack>
                    <HStack>
                        <Button
                            size="medium"
                            intent="neutral"
                            onPress={handleGiveFeedback}
                            testID="@home/onboarding-feedback-banner/give-feedback"
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

import { ImageBackground, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { selectDeviceInternalModel } from '@suite-common/device';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { Box, Button, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { setIsOnboardingFeedbackBannerEnabled } from '@suite-native/banners';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useServices } from '@trezor/dependency-injection';
import { getSuiteVersion } from '@trezor/env-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { getOnboardingSurveyUrl } from '@trezor/urls';

const containerStyle = prepareNativeStyle(utils => ({
    minHeight: 160,
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
    const openLink = useOpenLink();
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const deviceModel = useSelector(selectDeviceInternalModel);

    const handleBannerAction = (action: 'open' | 'close') => {
        analytics.report({
            type: events.onboardingSurveyBannerEvent.name,
            payload: { action, origin: 'postOnboardingDashboard' },
        });
        dispatch(setIsOnboardingFeedbackBannerEnabled(false));
    };

    const handleOpen = () => {
        handleBannerAction('open');
        openLink(
            getOnboardingSurveyUrl({
                platform: 'mobile',
                appVersion: getSuiteVersion(),
                deviceModel,
            }),
            { enforce: true },
        );
    };

    return (
        <ImageBackground
            source={require('../../../assets/onboardingSurveyBannerBackground.webp')}
            resizeMode="cover"
            style={applyStyle(containerStyle)}
            fadeDuration={0}
        >
            <Box style={applyStyle(overlayStyle)} />
            <HStack style={{ flexGrow: 1 }}>
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
                            onPress={handleOpen}
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
                        onPress={() => handleBannerAction('close')}
                        testID="@home/onboarding-feedback-banner/close"
                    />
                </Box>
            </HStack>
        </ImageBackground>
    );
};

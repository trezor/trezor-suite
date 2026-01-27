import { useState } from 'react';

import { AnalyticsSharedEvents } from '@suite-common/analytics-types';
import {
    AnalyticsNativeEvents,
    EventType,
    SuiteNativeLegacyAnalyticsEvents,
} from '@suite-native/analytics';
import {
    Box,
    Button,
    Card,
    PressableOpacity,
    Switch,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { useAnalytics, useLegacyAnalytics } from '@suite-native/services';
import { Analytics } from '@trezor/analytics';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { DATA_PRIVACY_URL } from '@trezor/urls';

import { AnalyticsInfoRow } from '../components/AnalyticsInfoRow';

const consentWrapperStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    borderRadius: utils.borders.radii.r16,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
}));

const reportAnalyticsOnboardingCompleted = (
    isTrackingAllowed: boolean,
    legacyAnalytics: Analytics<SuiteNativeLegacyAnalyticsEvents>,
    analytics: Analytics<AnalyticsSharedEvents> & Analytics<AnalyticsNativeEvents>,
) => {
    // For users who have not allowed tracking, enable analytics just for reporting
    // the OnboardingCompleted event and then disable it again.
    if (!isTrackingAllowed) {
        analytics.enable();
        legacyAnalytics.enable();
    }
    legacyAnalytics.report({
        type: EventType.OnboardingCompleted,
        payload: { analyticsPermission: isTrackingAllowed },
    });
    if (!isTrackingAllowed) {
        analytics.disable();
        legacyAnalytics.disable();
    }
};

export const AnalyticsConsentScreen = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.AnalyticsConsent>) => {
    const analytics = useAnalytics();
    const legacyAnalytics = useLegacyAnalytics();
    const [isEnabled, setIsEnabled] = useState(true);

    const { applyStyle } = useNativeStyles();

    const handleOpenLink = useOpenLink();

    const handleRedirect = () => {
        reportAnalyticsOnboardingCompleted(isEnabled, legacyAnalytics, analytics);

        navigation.navigate(OnboardingStackRoutes.Biometrics);
    };

    const handleAnalyticsConsent = () => {
        legacyAnalytics.enable();
        analytics.enable();
        handleRedirect();
    };

    const handleClickOnLearMoreLink = () => {
        handleOpenLink(DATA_PRIVACY_URL);
    };

    const toggleAnalyticsConsent = () => {
        setIsEnabled(prevIsEnabled => !prevIsEnabled);
    };

    return (
        <Screen>
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp24" paddingTop="sp32">
                    <TitleHeader
                        title={<Translation id="moduleOnboarding.analyticsConsentScreen.title" />}
                        titleVariant="titleMedium"
                        subtitle={
                            <Translation id="moduleOnboarding.analyticsConsentScreen.subtitle" />
                        }
                        titleSpacing="sp12"
                    />
                    <Card>
                        <Box>
                            <VStack flex={1}>
                                <VStack spacing="sp24" paddingBottom="sp16">
                                    <AnalyticsInfoRow
                                        iconName="eyeSlash"
                                        title={
                                            <Translation id="moduleOnboarding.analyticsConsentScreen.bulletPoints.privacy.title" />
                                        }
                                        description={
                                            <Translation id="moduleOnboarding.analyticsConsentScreen.bulletPoints.privacy.description" />
                                        }
                                    />
                                    <AnalyticsInfoRow
                                        iconName="bugBeetle"
                                        title={
                                            <Translation id="moduleOnboarding.analyticsConsentScreen.bulletPoints.dataCollection.title" />
                                        }
                                        description={
                                            <Translation id="moduleOnboarding.analyticsConsentScreen.bulletPoints.dataCollection.description" />
                                        }
                                    />
                                </VStack>
                                <PressableOpacity onPress={toggleAnalyticsConsent}>
                                    <Box
                                        flexDirection="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        style={applyStyle(consentWrapperStyle)}
                                    >
                                        <Text>
                                            <Translation id="moduleOnboarding.analyticsConsentScreen.helpSwitchTitle" />
                                        </Text>
                                        <Switch
                                            testID="@onboarding/AnalyticsConsent/consentSwitch"
                                            isChecked={isEnabled}
                                            onChange={toggleAnalyticsConsent}
                                        />
                                    </Box>
                                </PressableOpacity>
                            </VStack>
                        </Box>
                    </Card>
                </VStack>
                <VStack spacing="sp12">
                    <Button
                        testID="@onboarding/AnalyticsConsent/nextBtn"
                        onPress={isEnabled ? handleAnalyticsConsent : handleRedirect}
                    >
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                    <Button
                        colorScheme="tertiaryElevation0"
                        testID="@onboarding/AnalyticsConsent/learMoreBtn"
                        onPress={handleClickOnLearMoreLink}
                    >
                        <Translation id="moduleOnboarding.analyticsConsentScreen.learnMoreButton" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};

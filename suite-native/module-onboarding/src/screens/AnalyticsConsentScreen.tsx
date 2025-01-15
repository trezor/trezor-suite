import { useState } from 'react';

import { Screen } from '@suite-native/navigation';
import { Box, Button, Card, Switch, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { EventType, analytics } from '@suite-native/analytics';
import { useOpenLink } from '@suite-native/link';
import { useToast } from '@suite-native/toasts';

import { AnalyticsInfoRow } from '../components/AnalyticsInfoRow';

const LEARN_MORE_LINK = 'https://data.trezor.io/legal/privacy-policy.html';

const consentWrapperStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    borderRadius: utils.borders.radii.r16,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
}));

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

export const AnalyticsConsentScreen = () => {
    const { showToast } = useToast();
    const [isEnabled, setIsEnabled] = useState(true);

    const { applyStyle } = useNativeStyles();

    const handleOpenLink = useOpenLink();

    const handleRedirect = () => {
        reportAnalyticsOnboardingCompleted(isEnabled);

        showToast({ variant: 'warning', message: 'TODO: implement next screen' });
        // navigation.navigate(OnboardingStackRoutes.Biometrics);
    };

    const handleAnalyticsConsent = () => {
        analytics.enable();
        handleRedirect();
    };

    const handleClickOnLearMoreLink = () => {
        handleOpenLink(LEARN_MORE_LINK);
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
                                        isChecked={isEnabled}
                                        onChange={enabled => {
                                            setIsEnabled(enabled);
                                        }}
                                    />
                                </Box>
                            </VStack>
                        </Box>
                    </Card>
                </VStack>
                <VStack spacing="sp12">
                    <Button
                        testID="@onboarding/UserDataConsent/allow"
                        onPress={isEnabled ? handleAnalyticsConsent : handleRedirect}
                    >
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                    <Button
                        colorScheme="tertiaryElevation0"
                        testID="@onboarding/UserDataConsent/allow"
                        onPress={handleClickOnLearMoreLink}
                    >
                        <Translation id="moduleOnboarding.analyticsConsentScreen.learnMoreButton" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};

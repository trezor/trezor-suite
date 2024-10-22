import { useState } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/core';

import { setIsOnboardingFinished } from '@suite-native/settings';
import {
    HomeStackRoutes,
    OnboardingStackParamList,
    OnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Box, Button, Stack, Switch, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { EventType, analytics } from '@suite-native/analytics';
import { Link } from '@suite-native/link';

import { AnalyticsInfoRow } from '../components/AnalyticsInfoRow';

type NavigationProps = StackToStackCompositeNavigationProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.AnalyticsConsent,
    RootStackParamList
>;

const titleStyle = prepareNativeStyle(utils => ({
    textAlign: 'center',
    marginTop: utils.spacings.sp24,
    marginBottom: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp24,
}));

const subtitleStyle = prepareNativeStyle(utils => ({
    textAlign: 'center',
    marginBottom: utils.spacings.sp24,
    paddingHorizontal: utils.spacings.sp24,
}));

const buttonsWrapperStyle = prepareNativeStyle(() => ({
    width: '90%',
    alignSelf: 'center',
    marginBottom: 28,
}));

const cardStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp16,
    marginTop: utils.spacings.sp16,
    marginBottom: utils.spacings.sp32,
    paddingHorizontal: utils.spacings.sp16,
    paddingTop: 60,
    paddingBottom: 20,
    borderRadius: 20,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation1,
    backgroundColor: utils.transparentize(0.3, utils.colors.backgroundSurfaceElevation1),
    ...(Platform.OS === 'ios' ? utils.boxShadows.small : {}),
}));

const consentInfoStyle = prepareNativeStyle(utils => ({
    gap: utils.spacings.sp8,
    paddingVertical: utils.spacings.sp4,
    alignItems: 'center',
}));

const analyticsConsentStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
}));

const consentWrapperStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp16,
    marginBottom: utils.spacings.sp8,
    borderRadius: utils.spacings.sp16,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    const [isEnabled, setIsEnabled] = useState(true);

    const navigation = useNavigation<NavigationProps>();

    const { applyStyle } = useNativeStyles();

    const dispatch = useDispatch();

    const handleRedirect = () => {
        dispatch(setIsOnboardingFinished());
        reportAnalyticsOnboardingCompleted(isEnabled);

        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                ],
            }),
        );
    };

    const handleAnalyticsConsent = () => {
        analytics.enable();
        handleRedirect();
    };

    return (
        <Screen>
            <Box
                alignItems="center"
                flex={1}
                justifyContent="space-between"
                style={applyStyle(cardStyle)}
            >
                <Icon size="extraLarge" name="trezorLogo" color="iconDefault" />
                <Text variant="titleMedium" style={applyStyle(titleStyle)}>
                    <Translation id="moduleOnboarding.analyticsConsentScreen.title" />
                </Text>
                <Text color="textSubdued" style={applyStyle(subtitleStyle)}>
                    <Translation id="moduleOnboarding.analyticsConsentScreen.subtitle" />
                </Text>
                <VStack style={applyStyle(analyticsConsentStyle)}>
                    <Stack spacing="sp24" paddingBottom="sp16">
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
                    </Stack>
                    <Box
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="space-between"
                        style={applyStyle(consentWrapperStyle)}
                    >
                        <Box flexDirection="row" style={applyStyle(consentInfoStyle)}>
                            <Icon size="mediumLarge" name="info" color="iconPrimaryDefault" />
                            <Text variant="hint" textAlign="center">
                                <Translation id="moduleOnboarding.analyticsConsentScreen.helpSwitchTitle" />
                            </Text>
                        </Box>
                        <Box>
                            <Switch
                                isChecked={isEnabled}
                                onChange={enabled => {
                                    setIsEnabled(enabled);
                                }}
                            />
                        </Box>
                    </Box>
                    <Text variant="hint" textAlign="center">
                        <Translation
                            id="moduleOnboarding.analyticsConsentScreen.learnMore"
                            values={{
                                securityLink: chunks => (
                                    <Link
                                        href="https://data.trezor.io/legal/privacy-policy.html"
                                        label={chunks}
                                        textColor="textSecondaryHighlight"
                                    />
                                ),
                            }}
                        />
                    </Text>
                </VStack>
            </Box>

            <Box style={applyStyle(buttonsWrapperStyle)}>
                <Button
                    testID="@onboarding/UserDataConsent/allow"
                    onPress={isEnabled ? handleAnalyticsConsent : handleRedirect}
                >
                    <Translation id="generic.buttons.confirm" />
                </Button>
            </Box>
        </Screen>
    );
};

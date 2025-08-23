import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import {
    selectDeviceModel,
    selectHasDeviceFirmwareInstalled,
    selectShouldOfferUpdateFirmware,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, Text, TextButton, TitleHeader, VStack } from '@suite-native/atoms';
import { SetupSupportingDeviceModel } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { resetOnboardingAnalyticsAtom, updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceModelImage } from '../components/DeviceModelImage';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { HeaderUnderlineSvg } from '../components/HeaderUnderlineSvg';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

const UninitializedDeviceLandingScreenContent = () => {
    const deviceModel = useSelector(selectDeviceModel) as SetupSupportingDeviceModel;
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);

    if (!deviceModel) {
        return null;
    }

    return (
        <VStack spacing="sp32">
            {hasDeviceFirmwareInstalled ? (
                <TitleHeader
                    title={
                        <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.title" />
                    }
                    titleVariant="titleMedium"
                    subtitle={
                        <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.subtitle" />
                    }
                />
            ) : (
                <Box alignItems="center">
                    <Text variant="titleMedium" textAlign="center" style={{ letterSpacing: -0.5 }}>
                        <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.noFirmware.title" />
                    </Text>
                    <HeaderUnderlineSvg />
                </Box>
            )}
            <DeviceModelImage
                deviceModel={deviceModel}
                size={hasDeviceFirmwareInstalled ? 'small' : 'normal'}
            />
        </VStack>
    );
};

export const UninitializedDeviceLandingScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.UninitializedDeviceLanding
>) => {
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const shouldOfferUpdateFirmware = useSelector(selectShouldOfferUpdateFirmware);
    const deviceModel = useSelector(selectDeviceModel);
    const resetOnboardingAnalytics = useSetAtom(resetOnboardingAnalyticsAtom);
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();
    const handleConfirmButtonPress = () => {
        if (hasDeviceFirmwareInstalled) {
            if (shouldOfferUpdateFirmware) {
                navigation.navigate(DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate);
            } else {
                // If user already has the latest firmware installed, skip this update screen and navigate to device auth-check directly.
                updateOnboardingAnalytics({
                    firmware: 'up-to-date',
                });

                navigateToNextScreenAfterFirmwareInstallation();
            }
        } else {
            // Security check is relevant for brand new devices without FW only.
            navigation.navigate(DeviceOnboardingStackRoutes.SecurityCheck);
        }
    };

    const handleNeverUsedThisDeviceButtonPress = () => {
        const suspicionCause = 'firmwareAlreadyInstalled';
        navigation.navigate(DeviceOnboardingStackRoutes.SuspiciousDevice, {
            suspicionCause: 'firmwareAlreadyInstalled',
        });

        analytics.report({
            type: EventType.DeviceSetupSecurityCheck,
            payload: {
                location: suspicionCause,
            },
        });
    };

    const handleDeviceLooksDifferentButtonPress = () => {
        const suspicionCause = 'deviceLooksDifferent';
        navigation.navigate(DeviceOnboardingStackRoutes.SuspiciousDevice, {
            suspicionCause,
        });

        analytics.report({
            type: EventType.DeviceSetupSecurityCheck,
            payload: {
                location: suspicionCause,
            },
        });
    };

    useEffect(() => {
        resetOnboardingAnalytics();
        analytics.report({
            type: EventType.DeviceSetupStarted,
            payload: {
                osName: Platform.OS,
                deviceModel,
            },
        });
        // report device-setup event only on first render of this screen
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <DeviceOnboardingScreenWithExitButton>
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp32">
                    <UninitializedDeviceLandingScreenContent />
                    <TextButton
                        isUnderlined
                        onPress={handleDeviceLooksDifferentButtonPress}
                        testID="@deviceOnboarding/UninitializedDeviceLandingScreen/deviceLooksDifferentBtn"
                    >
                        <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.lookDifferentLabel" />
                    </TextButton>
                </VStack>
                <VStack spacing="sp12">
                    <Button
                        onPress={handleConfirmButtonPress}
                        testID="@deviceOnboarding/UninitializedDeviceLandingScreen/confirmBtn"
                    >
                        {hasDeviceFirmwareInstalled ? (
                            <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.button" />
                        ) : (
                            <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.noFirmware.button" />
                        )}
                    </Button>
                    {hasDeviceFirmwareInstalled && (
                        <Button
                            colorScheme="tertiaryElevation0"
                            onPress={handleNeverUsedThisDeviceButtonPress}
                            testID="@deviceOnboarding/UninitializedDeviceLandingScreen/declineBtn"
                        >
                            <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.noButton" />
                        </Button>
                    )}
                </VStack>
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};

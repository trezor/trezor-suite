import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import {
    selectHasDeviceFirmwareInstalled,
    selectShouldOfferUpdateFirmware,
} from '@suite-common/device';
import { events } from '@suite-native/analytics';
import { Box, Button, Text, TextButton, VStack } from '@suite-native/atoms';
import { type SetupSupportingDeviceModel, useCoinLabel } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { resetOnboardingAnalyticsAtom, updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceModelImage } from '../components/DeviceModelImage';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { HeaderUnderlineSvg } from '../components/HeaderUnderlineSvg';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

const UninitializedDeviceLandingScreenContent = ({
    deviceModel,
}: {
    deviceModel: SetupSupportingDeviceModel;
}) => {
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const coinLabel = useCoinLabel();

    return (
        <VStack spacing="sp32">
            {!hasDeviceFirmwareInstalled && (
                <Box alignItems="center">
                    <Text variant="headline-md" textAlign="center" style={{ letterSpacing: -0.5 }}>
                        <Translation
                            id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.noFirmware.title"
                            values={{
                                coinLabel,
                            }}
                        />
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
    route: { params },
}: StackToStackCompositeScreenProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
    RootStackParamList
>) => {
    const analytics = useAnalytics();
    const deviceModel = params.deviceModel as SetupSupportingDeviceModel;
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const shouldOfferUpdateFirmware = useSelector(selectShouldOfferUpdateFirmware);

    const resetOnboardingAnalytics = useSetAtom(resetOnboardingAnalyticsAtom);
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    const handleConfirmButtonPress = () => {
        if (hasDeviceFirmwareInstalled) {
            if (shouldOfferUpdateFirmware) {
                navigation.replace(DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate);
            } else {
                // If user already has the latest firmware installed, skip this update screen and navigate to device auth-check directly.
                updateOnboardingAnalytics({
                    firmware: 'up-to-date',
                });

                navigateToNextScreenAfterFirmwareInstallation();
            }
        } else {
            // Security check is relevant for brand new devices without FW only.
            navigation.replace(DeviceOnboardingStackRoutes.SecurityCheck);
        }
    };

    const handleNeverUsedThisDeviceButtonPress = () => {
        const suspicionCause = 'firmwareAlreadyInstalled';
        navigation.navigate(DeviceOnboardingStackRoutes.SuspiciousDevice, {
            suspicionCause: 'firmwareAlreadyInstalled',
        });

        analytics.report({
            type: events.deviceSetupSecurityCheckEvent.name,
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
            type: events.deviceSetupSecurityCheckEvent.name,
            payload: {
                location: suspicionCause,
            },
        });
    };

    useEffect(() => {
        resetOnboardingAnalytics();
        analytics.report({
            type: events.deviceSetupStartedEvent.name,
            payload: {
                osName: Platform.OS,
                deviceModel,
            },
        });
        // report device-setup event only on first render of this screen
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const screenHeaderProps = hasDeviceFirmwareInstalled
        ? {
              screenHeaderTitle: (
                  <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.title" />
              ),
              screenHeaderSubtitle: (
                  <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.subtitle" />
              ),
          }
        : {};

    return (
        <DeviceOnboardingScreenWithExitButton {...screenHeaderProps}>
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp32">
                    <UninitializedDeviceLandingScreenContent deviceModel={deviceModel} />
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

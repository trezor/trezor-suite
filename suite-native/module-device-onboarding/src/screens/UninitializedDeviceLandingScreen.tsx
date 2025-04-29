import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import {
    selectDeviceModel,
    selectHasDeviceFirmwareInstalled,
    selectIsLatestFirmwareInstalled,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, Image, Text, TextButton, TitleHeader, VStack } from '@suite-native/atoms';
import { SetupSupportingDeviceModel } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { resetOnboardingAnalyticsAtom, updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { HeaderUnderlineSvg } from '../components/HeaderUnderlineSvg';

const trezorImageStyle = prepareNativeStyle<{ hasDeviceFirmwareInstalled: boolean }>(
    (_, { hasDeviceFirmwareInstalled }) => ({
        width: '100%',
        height: hasDeviceFirmwareInstalled ? 280 : 360,
        maxHeight: (getScreenHeight() / 3) * 2,
        alignItems: 'center',
    }),
);

const trezorModelImageMap = {
    [DeviceModelInternal.T2B1]: require('../assets/t3b1.png'),
    [DeviceModelInternal.T3B1]: require('../assets/t3b1.png'),
    [DeviceModelInternal.T3T1]: require('../assets/t3t1.png'),
} as const satisfies Record<SetupSupportingDeviceModel, string>;

const UninitializedDeviceLandingScreenContent = () => {
    const { applyStyle } = useNativeStyles();
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
            <Image
                source={trezorModelImageMap[deviceModel]}
                contentFit="contain"
                style={applyStyle(trezorImageStyle, {
                    hasDeviceFirmwareInstalled,
                })}
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
    const isLatestFirmwareInstalled = useSelector(selectIsLatestFirmwareInstalled);
    const deviceModel = useSelector(selectDeviceModel);
    const resetOnboardingAnalytics = useSetAtom(resetOnboardingAnalyticsAtom);
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const handleConfirmButtonPress = () => {
        if (hasDeviceFirmwareInstalled) {
            if (isLatestFirmwareInstalled) {
                // If user already has the latest firmware installed, skip this update screen and navigate to device auth-check directly.
                navigation.navigate(DeviceOnboardingStackRoutes.DeviceTutorial);
                updateOnboardingAnalytics({
                    firmware: 'up-to-date',
                });
            } else {
                navigation.navigate(DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate);
            }
        } else {
            // Security check is relevant for brand new devices only.
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
                        testID="@onboarding/UninitializedDeviceLandingScreen/deviceLooksDifferentBtn"
                    >
                        <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.lookDifferentLabel" />
                    </TextButton>
                </VStack>
                <VStack spacing="sp12">
                    <Button
                        onPress={handleConfirmButtonPress}
                        testID="@onboarding/UninitializedDeviceLandingScreen/confirmBtn"
                    >
                        <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.noFirmware.button" />
                    </Button>
                    {hasDeviceFirmwareInstalled && (
                        <Button
                            colorScheme="tertiaryElevation0"
                            onPress={handleNeverUsedThisDeviceButtonPress}
                            testID="@onboarding/UninitializedDeviceLandingScreen/declineBtn"
                        >
                            <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.noButton" />
                        </Button>
                    )}
                </VStack>
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};

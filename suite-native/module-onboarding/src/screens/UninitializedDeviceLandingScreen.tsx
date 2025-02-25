import { useSelector } from 'react-redux';

import { selectDeviceModel, selectHasDeviceFirmwareInstalled } from '@suite-common/wallet-core';
import { Box, Button, Image, Text, TextButton, TitleHeader, VStack } from '@suite-native/atoms';
import { SetupSupportingDeviceModel } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { HeaderUnderlineSvg } from '../components/HeaderUnderlineSvg';
import { OnboardingScreenWithExitButton } from '../components/OnboardingScreenWithExitButton';

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
                        <Translation id="moduleOnboarding.uninitializedDeviceLandingScreen.firmware.title" />
                    }
                    titleVariant="titleMedium"
                    subtitle={
                        <Translation id="moduleOnboarding.uninitializedDeviceLandingScreen.firmware.subtitle" />
                    }
                />
            ) : (
                <Box alignItems="center">
                    <Text variant="titleMedium" textAlign="center" style={{ letterSpacing: -0.5 }}>
                        <Translation id="moduleOnboarding.uninitializedDeviceLandingScreen.noFirmware.title" />
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
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.UninitializedDeviceLanding>) => {
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);

    const handleConfirmButtonPress = () => {
        if (hasDeviceFirmwareInstalled) {
            navigation.navigate(OnboardingStackRoutes.ConfirmFirmwareUpdate);
        } else {
            navigation.navigate(OnboardingStackRoutes.SecurityCheck);
        }
    };

    const handleNeverUsedThisDeviceButtonPress = () => {
        navigation.navigate(OnboardingStackRoutes.SuspiciousDevice, {
            suspicionCause: 'firmwareAlreadyInstalled',
        });
    };

    const handleDeviceLooksDifferentButtonPress = () => {
        navigation.navigate(OnboardingStackRoutes.SuspiciousDevice, {
            suspicionCause: 'deviceLooksDifferent',
        });
    };

    return (
        <OnboardingScreenWithExitButton>
            <VStack justifyContent="space-between" flex={1} paddingTop="sp16">
                <VStack spacing="sp32">
                    <UninitializedDeviceLandingScreenContent />
                    <TextButton
                        isUnderlined
                        onPress={handleDeviceLooksDifferentButtonPress}
                        testID="@onboarding/UninitializedDeviceLandingScreen/deviceLooksDifferentBtn"
                    >
                        <Translation id="moduleOnboarding.uninitializedDeviceLandingScreen.lookDifferentLabel" />
                    </TextButton>
                </VStack>
                <VStack spacing="sp12">
                    <Button
                        onPress={handleConfirmButtonPress}
                        testID="@onboarding/UninitializedDeviceLandingScreen/confirmBtn"
                    >
                        <Translation id="moduleOnboarding.uninitializedDeviceLandingScreen.noFirmware.button" />
                    </Button>
                    {hasDeviceFirmwareInstalled && (
                        <Button
                            colorScheme="tertiaryElevation0"
                            onPress={handleNeverUsedThisDeviceButtonPress}
                            testID="@onboarding/UninitializedDeviceLandingScreen/declineBtn"
                        >
                            <Translation id="moduleOnboarding.uninitializedDeviceLandingScreen.firmware.noButton" />
                        </Button>
                    )}
                </VStack>
            </VStack>
        </OnboardingScreenWithExitButton>
    );
};

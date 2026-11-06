import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import {
    selectHasDeviceFirmwareInstalled,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type PersistentDeviceDataRootState,
    persistentDeviceDataActions,
    selectDeviceNeedsManualCheck,
} from '@suite-common/persistent-device-data';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Box, Button, Text, TextButton, VStack } from '@suite-native/atoms';
import { useCoinLabel } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { resetOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceModelImage } from '../components/DeviceModelImage';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { HeaderUnderlineSvg } from '../components/HeaderUnderlineSvg';
import { useNavigateAfterManualDeviceCheck } from '../hooks/useNavigateAfterManualDeviceCheck';

type ManualDeviceCheckScreenContentProps = {
    deviceModel: DeviceModelInternal;
};

const ManualDeviceCheckScreenContent = ({ deviceModel }: ManualDeviceCheckScreenContentProps) => {
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

/**
 * First step of Manual Device check, which is shared for both devices with and without firmware.
 * It is also the entry point of the device onboarding flow, so if the check has been already passed,
 * it is skipped right away.
 *
 * See also ManualDeviceCheckWithoutFirmwareScreen, the 2nd step only for devices without firmware.
 * Note that this is a different design from Web/Desktop, where there are separate screens for both cases, with no 2nd step.
 */
export const ManualDeviceCheckScreen = ({
    navigation,
    route: { params },
}: StackToStackCompositeScreenProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ManualDeviceCheck,
    RootStackParamList
>) => {
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const { deviceModel } = params;
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const device = useSelector(selectSelectedDevice);
    const deviceId = device?.id;
    const shouldDoManualDeviceCheck = useSelector((state: PersistentDeviceDataRootState) =>
        selectDeviceNeedsManualCheck(state, device),
    );
    // Decided only on mount, because confirming the check on this screen changes the record.
    const [isManualDeviceCheckSkipped] = useState(!shouldDoManualDeviceCheck);

    const resetOnboardingAnalytics = useSetAtom(resetOnboardingAnalyticsAtom);

    const { navigateAfterManualDeviceCheck } = useNavigateAfterManualDeviceCheck();

    const handleConfirmButtonPress = () => {
        dispatch(persistentDeviceDataActions.setManualDeviceCheckSuccess({ deviceId }));
        navigateAfterManualDeviceCheck();
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
        // Initialized device only passes the interactive device checks, it isn't being set up.
        if (!isDeviceInitialized) {
            resetOnboardingAnalytics();
            analytics.report({
                type: events.deviceSetupStartedEvent.name,
                payload: {
                    osName: Platform.OS,
                    deviceModel,
                },
            });
        }

        // After the analytics reset, as the next step may already update the analytics.
        if (isManualDeviceCheckSkipped) navigateAfterManualDeviceCheck();

        // Run only on first render of this screen: report device-setup event, and skip the check if passed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isManualDeviceCheckSkipped) return null;

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
                    <ManualDeviceCheckScreenContent deviceModel={deviceModel} />
                    <TextButton
                        isUnderlined
                        onPress={handleDeviceLooksDifferentButtonPress}
                        testID="@deviceOnboarding/ManualDeviceCheckScreen/deviceLooksDifferentBtn"
                    >
                        <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.lookDifferentLabel" />
                    </TextButton>
                </VStack>
                <VStack spacing="sp12">
                    <Button
                        onPress={handleConfirmButtonPress}
                        testID="@deviceOnboarding/ManualDeviceCheckScreen/confirmBtn"
                    >
                        {hasDeviceFirmwareInstalled ? (
                            <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.button" />
                        ) : (
                            <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.noFirmware.button" />
                        )}
                    </Button>
                    {hasDeviceFirmwareInstalled && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onPress={handleNeverUsedThisDeviceButtonPress}
                            testID="@deviceOnboarding/ManualDeviceCheckScreen/declineBtn"
                        >
                            <Translation id="moduleDeviceOnboarding.uninitializedDeviceLandingScreen.firmware.noButton" />
                        </Button>
                    )}
                </VStack>
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};

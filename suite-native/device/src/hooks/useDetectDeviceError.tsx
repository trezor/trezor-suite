import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    acquireDevice,
    deviceActions,
    selectHasDeviceFirmwareInstalled,
    selectIsConnectedDeviceUninitialized,
    selectIsDeviceInBootloader,
    selectIsNoPhysicalDeviceConnected,
    selectIsPortfolioTrackerDevice,
    selectIsUnacquiredDevice,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import { SUITE_LITE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import {
    AuthorizeDeviceStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { captureSentryException } from '@suite-native/sentry';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { SUITE_WEB_URL } from '@trezor/urls';

import { BootloaderModalAppendix } from '../components/BootloaderModalAppendix';
import { IncompatibleFirmwareModalAppendix } from '../components/IncompatibleFirmwareModalAppendix';
import { UnacquiredDeviceModalAppendix } from '../components/UnacquiredDeviceModalAppendix';
import { UninitializedDeviceModalAppendix } from '../components/UninitializedDeviceModalAppendix';
import {
    selectDeviceError,
    selectIsDeviceFirmwareSupported,
    selectIsDeviceSetupSupported,
} from '../selectors';

type NavigationProps = StackToStackCompositeNavigationProps<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const useDetectDeviceError = () => {
    const [wasDeviceEjectedByUser, setWasDeviceEjectedByUser] = useState(false);

    const dispatch = useDispatch();
    const { hideAlert, showAlert } = useAlert();
    const openLink = useOpenLink();
    const navigation = useNavigation<NavigationProps>();

    const selectedDevice = useSelector(selectSelectedDevice);
    const isUnacquiredDevice = useSelector(selectIsUnacquiredDevice);
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);

    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);
    const deviceError = useSelector(selectDeviceError);

    const handleDisconnect = useCallback(() => {
        if (selectedDevice) {
            dispatch(deviceActions.deviceDisconnect(selectedDevice));

            analytics.report({
                type: EventType.EjectDeviceClick,
                payload: { origin: 'deviceNotReadyModal' },
            });

            // it takes some time until the device disconnect action makes changes to the state,
            // so we need to make sure that the error alert won't reappear again before it happens.
            setWasDeviceEjectedByUser(true);
        }
    }, [selectedDevice, dispatch]);

    // If device is unacquired (restarted app, another app fetched device session, ...),
    // we cannot work with device anymore. Shouldn't happen on mobile app but just in case.
    useEffect(() => {
        if (isUnacquiredDevice && isOnboardingFinished) {
            showAlert({
                title: <Translation id="moduleDevice.unacquiredDeviceModal.title" />,
                description: <Translation id="moduleDevice.unacquiredDeviceModal.description" />,
                pictogramVariant: 'critical',
                primaryButtonTitle: <Translation id="moduleDevice.unacquiredDeviceModal.button" />,
                appendix: <UnacquiredDeviceModalAppendix />,
                onPressPrimaryButton: () => {
                    dispatch(
                        acquireDevice({
                            startDiscovery: true,
                        }),
                    );
                },
                testID: '@device/errors/alert/unacquired-device',
            });
        } else {
            hideAlert();
        }
    }, [isOnboardingFinished, isUnacquiredDevice, dispatch, hideAlert, showAlert]);

    useEffect(() => {
        if (
            !isDeviceFirmwareSupported &&
            isOnboardingFinished &&
            !isPortfolioTrackerDevice &&
            !wasDeviceEjectedByUser &&
            !isDeviceSetupSupported
        ) {
            showAlert({
                title: <Translation id="moduleDevice.unsupportedFirmwareModal.title" />,
                description: <Translation id="moduleDevice.unsupportedFirmwareModal.description" />,
                pictogramVariant: 'critical',
                primaryButtonTitle: <Translation id="generic.buttons.eject" />,
                primaryButtonVariant: 'tertiaryElevation1',
                appendix: <IncompatibleFirmwareModalAppendix />,
                onPressPrimaryButton: () => {
                    handleDisconnect();
                    analytics.report({
                        type: EventType.UnsupportedDevice,
                        payload: { deviceState: 'unsupportedFirmware' },
                    });
                },
                testID: '@device/errors/alert/unsupported-firmware',
            });
        }
    }, [
        isDeviceFirmwareSupported,
        isOnboardingFinished,
        isPortfolioTrackerDevice,
        wasDeviceEjectedByUser,
        dispatch,
        showAlert,
        handleDisconnect,
        isDeviceSetupSupported,
    ]);

    useEffect(() => {
        if (!isOnboardingFinished || isDeviceSetupSupported) return;

        if (
            isConnectedDeviceUninitialized &&
            !isFirmwareInstallationRunning &&
            !wasDeviceEjectedByUser &&
            !isUnacquiredDevice &&
            !deviceError
        ) {
            if (hasDeviceFirmwareInstalled) {
                showAlert({
                    title: <Translation id="moduleDevice.noSeedWithFWModal.title" />,
                    pictogramVariant: 'success',
                    description: <Translation id="moduleDevice.noSeedWithFWModal.description" />,
                    primaryButtonTitle: (
                        <Translation id="moduleDevice.noSeedWithFWModal.primaryButton" />
                    ),
                    primaryButtonViewLeft: 'arrowLineUpRight',
                    onPressPrimaryButton: () => {
                        openLink(SUITE_WEB_URL);

                        analytics.report({
                            type: EventType.UnsupportedDevice,
                            payload: { deviceState: 'noSeedWithFirmware' },
                        });
                    },
                    testID: '@device/errors/alert/no-seed/firmware',
                });
            } else {
                showAlert({
                    title: <Translation id="moduleDevice.noSeedModal.title" />,
                    textAlign: 'left',
                    description: <Translation id="moduleDevice.noSeedModal.description" />,
                    primaryButtonTitle: <Translation id="moduleDevice.noSeedModal.primaryButton" />,
                    primaryButtonViewLeft: 'arrowLineUpRight',
                    appendix: <UninitializedDeviceModalAppendix />,
                    onPressPrimaryButton: () => {
                        openLink(SUITE_WEB_URL);

                        analytics.report({
                            type: EventType.UnsupportedDevice,
                            payload: { deviceState: 'noSeed' },
                        });
                    },
                    secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    onPressSecondaryButton: handleDisconnect,
                    testID: '@device/errors/alert/no-seed',
                });
            }
        }
    }, [
        hasDeviceFirmwareInstalled,
        isConnectedDeviceUninitialized,
        isFirmwareInstallationRunning,
        isOnboardingFinished,
        isUnacquiredDevice,
        wasDeviceEjectedByUser,
        showAlert,
        openLink,
        deviceError,
        handleDisconnect,
        isDeviceSetupSupported,
    ]);

    useEffect(() => {
        if (
            isDeviceInBootloader &&
            hasDeviceFirmwareInstalled &&
            !isFirmwareInstallationRunning &&
            !wasDeviceEjectedByUser &&
            isOnboardingFinished
        ) {
            showAlert({
                title: <Translation id="moduleDevice.bootloaderModal.title" />,
                description: <Translation id="moduleDevice.bootloaderModal.description" />,
                pictogramVariant: 'critical',
                primaryButtonVariant: 'tertiaryElevation1',
                primaryButtonTitle: <Translation id="generic.buttons.eject" />,
                appendix: <BootloaderModalAppendix />,
                onPressPrimaryButton: () => {
                    handleDisconnect();
                    analytics.report({
                        type: EventType.UnsupportedDevice,
                        payload: { deviceState: 'bootloaderMode' },
                    });
                },
                testID: '@device/errors/alert/bootloader',
            });
        }
    }, [
        isDeviceInBootloader,
        isFirmwareInstallationRunning,
        isOnboardingFinished,
        hasDeviceFirmwareInstalled,
        wasDeviceEjectedByUser,
        showAlert,
        handleDisconnect,
    ]);

    useEffect(() => {
        if (deviceError && !isUnacquiredDevice && isOnboardingFinished) {
            captureSentryException(new Error(`device error - ${deviceError}`));

            showAlert({
                title: <Translation id="moduleDevice.genericErrorModal.title" />,
                description: <Translation id="moduleDevice.genericErrorModal.description" />,
                pictogramVariant: 'critical',
                primaryButtonVariant: 'redBold',
                primaryButtonTitle: (
                    <Translation id="moduleDevice.genericErrorModal.buttons.reconnect" />
                ),
                onPressPrimaryButton: () => {
                    handleDisconnect();
                    navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                        screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
                    });
                },
                secondaryButtonTitle: (
                    <Translation id="moduleDevice.genericErrorModal.buttons.help" />
                ),
                secondaryButtonVariant: 'redElevation0',
                onPressSecondaryButton: () => openLink(SUITE_LITE_SUPPORT_URL),
                testID: '@device/errors/alert/error',
            });
        }
    }, [
        deviceError,
        handleDisconnect,
        isOnboardingFinished,
        isUnacquiredDevice,
        navigation,
        openLink,
        showAlert,
    ]);

    useEffect(() => {
        // Hide the error alert when the device is disconnected.
        // Device with error can't be view-only.
        // Edge case: If user has connected two devices simultaneously,
        // it will not hide the alert.
        if (isNoPhysicalDeviceConnected) {
            hideAlert();
        }
    }, [isNoPhysicalDeviceConnected, hideAlert]);
};

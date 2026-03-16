import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    deviceActions,
    selectHasDeviceFirmwareInstalled,
    selectIsConnectedDeviceUninitialized,
    selectIsDevicePinLocked,
    selectIsDeviceThpLocked,
    selectIsNoPhysicalDeviceConnected,
    selectIsPortfolioTrackerDevice,
    selectIsUnacquiredDevice,
    selectSelectedDevice,
} from '@suite-common/device';
import { acquireDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { events } from '@suite-native/analytics';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import { SUITE_MOBILE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import {
    AuthorizeDeviceStackRoutes,
    type HomeStackParamList,
    type HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    navigationContainerRef,
} from '@suite-native/navigation';
import { captureSentryException } from '@suite-native/sentry';
import { useAnalytics } from '@suite-native/services';
import { selectIsOnboardingFinished, selectShouldShowAutoEjectAlert } from '@suite-native/settings';
import { SUITE_WEB_URL } from '@trezor/urls';

import { IncompatibleFirmwareModalAppendix } from '../components/IncompatibleFirmwareModalAppendix';
import { UnacquiredDeviceModalAppendix } from '../components/UnacquiredDeviceModalAppendix';
import { UninitializedDeviceModalAppendix } from '../components/UninitializedDeviceModalAppendix';
import {
    selectDeviceError,
    selectIsDeviceFirmwareSupported,
    selectIsDeviceSetupSupported,
    selectShouldFactoryResetBeVisible,
} from '../selectors';

type NavigationProps = StackToStackCompositeNavigationProps<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const useDetectDeviceError = () => {
    const [wasDeviceEjectedByUser, setWasDeviceEjectedByUser] = useState(false);
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const { hideAlert, showAlert } = useAlert();
    const openLink = useOpenLink();
    const navigation = useNavigation<NavigationProps>();

    const selectedDevice = useSelector(selectSelectedDevice);
    const isUnacquiredDevice = useSelector(selectIsUnacquiredDevice);
    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);
    const shouldShowAutoEjectAlert = useSelector(selectShouldShowAutoEjectAlert);
    const isDevicePinLocked = useSelector(selectIsDevicePinLocked);

    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);
    const deviceError = useSelector(selectDeviceError);

    const handleDisconnect = useCallback(() => {
        if (selectedDevice) {
            dispatch(deviceActions.deviceDisconnect(selectedDevice));

            analytics.report({
                type: events.ejectDeviceClickEvent.name,
                payload: { origin: 'deviceNotReadyModal' },
            });

            // it takes some time until the device disconnect action makes changes to the state,
            // so we need to make sure that the error alert won't reappear again before it happens.
            setWasDeviceEjectedByUser(true);
        }
    }, [selectedDevice, dispatch, analytics]);

    // If device is unacquired (restarted app, another app fetched device session, ...),
    // we cannot work with device anymore. Shouldn't happen on mobile app but just in case.
    useEffect(() => {
        if (
            isOnboardingFinished &&
            isUnacquiredDevice &&
            !isDevicePinLocked &&
            !isDeviceThpLocked &&
            !isFirmwareInstallationRunning
        ) {
            showAlert({
                title: <Translation id="moduleDevice.unacquiredDeviceModal.title" />,
                type: 'deviceError',
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
            hideAlert('deviceError');
        }
    }, [
        isDevicePinLocked,
        isOnboardingFinished,
        isUnacquiredDevice,
        isDeviceThpLocked,
        isFirmwareInstallationRunning,
        dispatch,
        hideAlert,
        showAlert,
    ]);

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
                type: 'deviceError',
                pictogramVariant: 'critical',
                primaryButtonTitle: <Translation id="generic.buttons.eject" />,
                primaryButtonColorProps: { intent: 'neutral', priority: 'secondary' },
                appendix: <IncompatibleFirmwareModalAppendix />,
                onPressPrimaryButton: () => {
                    handleDisconnect();
                    analytics.report({
                        type: events.unsupportedDeviceEvent.name,
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
        analytics,
    ]);

    useEffect(() => {
        if (!isOnboardingFinished || isDeviceSetupSupported) return;

        if (
            isConnectedDeviceUninitialized &&
            !isFirmwareInstallationRunning &&
            !wasDeviceEjectedByUser &&
            !isUnacquiredDevice &&
            !deviceError &&
            !shouldFactoryResetBeVisible
        ) {
            if (hasDeviceFirmwareInstalled) {
                showAlert({
                    title: <Translation id="moduleDevice.noSeedWithFWModal.title" />,
                    pictogramVariant: 'success',
                    type: 'deviceError',
                    description: <Translation id="moduleDevice.noSeedWithFWModal.description" />,
                    primaryButtonTitle: (
                        <Translation id="moduleDevice.noSeedWithFWModal.primaryButton" />
                    ),
                    primaryButtonIconLeft: 'arrowLineUpRight',
                    onPressPrimaryButton: () => {
                        openLink(SUITE_WEB_URL);

                        analytics.report({
                            type: events.unsupportedDeviceEvent.name,
                            payload: { deviceState: 'noSeedWithFirmware' },
                        });
                    },
                    testID: '@device/errors/alert/no-seed/firmware',
                });
            } else {
                showAlert({
                    title: <Translation id="moduleDevice.noSeedModal.title" />,
                    type: 'deviceError',
                    textAlign: 'left',
                    description: <Translation id="moduleDevice.noSeedModal.description" />,
                    primaryButtonTitle: <Translation id="moduleDevice.noSeedModal.primaryButton" />,
                    primaryButtonIconLeft: 'arrowLineUpRight',
                    appendix: <UninitializedDeviceModalAppendix />,
                    onPressPrimaryButton: () => {
                        openLink(SUITE_WEB_URL);

                        analytics.report({
                            type: events.unsupportedDeviceEvent.name,
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
        shouldFactoryResetBeVisible,
        analytics,
    ]);

    useEffect(() => {
        if (
            shouldFactoryResetBeVisible &&
            !isFirmwareInstallationRunning &&
            !wasDeviceEjectedByUser &&
            isOnboardingFinished &&
            navigationContainerRef.isReady()
        ) {
            navigationContainerRef.reset({
                index: 0,
                routes: [{ name: RootStackRoutes.BootloaderMode }],
            });
        }
    }, [
        shouldFactoryResetBeVisible,
        isFirmwareInstallationRunning,
        isOnboardingFinished,
        navigation,
        wasDeviceEjectedByUser,
    ]);

    useEffect(() => {
        if (deviceError && !isUnacquiredDevice && isOnboardingFinished) {
            captureSentryException(new Error(`device error - ${deviceError}`));

            showAlert({
                title: <Translation id="moduleDevice.genericErrorModal.title" />,
                description: <Translation id="moduleDevice.genericErrorModal.description" />,
                type: 'deviceError',
                pictogramVariant: 'critical',
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
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
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                onPressSecondaryButton: () => openLink(SUITE_MOBILE_SUPPORT_URL),
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
        if (isNoPhysicalDeviceConnected && !shouldShowAutoEjectAlert) {
            hideAlert('deviceError');
        }
    }, [isNoPhysicalDeviceConnected, hideAlert, shouldShowAutoEjectAlert]);
};

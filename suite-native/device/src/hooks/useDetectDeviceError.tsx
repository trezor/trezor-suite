import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as Sentry from '@sentry/react-native';
import { useNavigation } from '@react-navigation/native';

import { analytics, EventType } from '@suite-native/analytics';
import {
    acquireDevice,
    deviceActions,
    selectDevice,
    selectIsConnectedDeviceUninitialized,
    selectIsNoPhysicalDeviceConnected,
    selectIsDeviceInBootloader,
    selectIsUnacquiredDevice,
    selectIsPortfolioTrackerDevice,
    selectHasDeviceFirmwareInstalled,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    StackToStackCompositeNavigationProps,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    AuthorizeDeviceStackRoutes,
} from '@suite-native/navigation';

import { selectDeviceError, selectIsDeviceFirmwareSupported } from '../selectors';
import { IncompatibleFirmwareModalAppendix } from '../components/IncompatibleFirmwareModalAppendix';
import { UninitializedDeviceModalAppendix } from '../components/UninitializedDeviceModalAppendix';
import { BootloaderModalAppendix } from '../components/BootloaderModalAppendix';
import { UnacquiredDeviceModalAppendix } from '../components/UnacquiredDeviceModalAppendix';

export const SUITE_WEB_URL = 'https://suite.trezor.io/web/';
export const SUITE_LITE_SUPPORT_URL = 'https://trezor.io/learn/c/trezor-suite-lite#open-chat';

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

    const selectedDevice = useSelector(selectDevice);
    const isUnacquiredDevice = useSelector(selectIsUnacquiredDevice);
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);

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
        if (isUnacquiredDevice) {
            showAlert({
                title: <Translation id="moduleDevice.unacquiredDeviceModal.title" />,
                description: <Translation id="moduleDevice.unacquiredDeviceModal.description" />,
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: <Translation id="moduleDevice.unacquiredDeviceModal.button" />,
                appendix: <UnacquiredDeviceModalAppendix />,
                onPressPrimaryButton: () => dispatch(acquireDevice()),
                testID: '@device/errors/alert/unacquired-device',
            });
        } else {
            hideAlert();
        }
    }, [isUnacquiredDevice, dispatch, hideAlert, showAlert]);

    useEffect(() => {
        if (!isDeviceFirmwareSupported && !isPortfolioTrackerDevice && !wasDeviceEjectedByUser) {
            showAlert({
                title: <Translation id="moduleDevice.unsupportedFirmwareModal.title" />,
                description: <Translation id="moduleDevice.unsupportedFirmwareModal.description" />,
                icon: 'warningCircle',
                pictogramVariant: 'red',
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
        isPortfolioTrackerDevice,
        wasDeviceEjectedByUser,
        dispatch,
        showAlert,
        handleDisconnect,
    ]);

    useEffect(() => {
        if (
            isConnectedDeviceUninitialized &&
            !wasDeviceEjectedByUser &&
            !isUnacquiredDevice &&
            !deviceError
        ) {
            if (hasDeviceFirmwareInstalled) {
                showAlert({
                    title: <Translation id="moduleDevice.noSeedWithFWModal.title" />,
                    icon: 'checkCircle',
                    pictogramVariant: 'green',
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
        isUnacquiredDevice,
        wasDeviceEjectedByUser,
        showAlert,
        openLink,
        deviceError,
        handleDisconnect,
    ]);

    useEffect(() => {
        if (isDeviceInBootloader && hasDeviceFirmwareInstalled && !wasDeviceEjectedByUser) {
            showAlert({
                title: <Translation id="moduleDevice.bootloaderModal.title" />,
                description: <Translation id="moduleDevice.bootloaderModal.description" />,
                icon: 'warningCircle',
                pictogramVariant: 'red',
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
        hasDeviceFirmwareInstalled,
        wasDeviceEjectedByUser,
        showAlert,
        handleDisconnect,
    ]);

    useEffect(() => {
        if (deviceError && !isUnacquiredDevice) {
            // console.error(deviceError);
            Sentry.captureException(new Error(`device error - ${deviceError}`));

            showAlert({
                title: <Translation id="moduleDevice.genericErrorModal.title" />,
                description: <Translation id="moduleDevice.genericErrorModal.description" />,
                icon: 'warningCircle',
                pictogramVariant: 'red',
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
    }, [deviceError, handleDisconnect, showAlert, openLink, navigation, isUnacquiredDevice]);

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

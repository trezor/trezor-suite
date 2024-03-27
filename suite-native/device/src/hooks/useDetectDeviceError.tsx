import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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

import { selectIsDeviceFirmwareSupported } from '../selectors';
import { IncompatibleDeviceModalAppendix } from '../components/IncompatibleDeviceModalAppendix';
import { BootloaderModalAppendix } from '../components/BootloaderModalAppendix';
import { UnacquiredDeviceModalAppendix } from '../components/UnacquiredDeviceModalAppendix';

export const useDetectDeviceError = () => {
    const [wasDeviceEjectedByUser, setWasDeviceEjectedByUser] = useState(false);

    const dispatch = useDispatch();
    const { hideAlert, showAlert } = useAlert();

    const selectedDevice = useSelector(selectDevice);
    const isUnacquiredDevice = useSelector(selectIsUnacquiredDevice);
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);

    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);

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
                appendix: <IncompatibleDeviceModalAppendix />,
                onPressPrimaryButton: () => {
                    handleDisconnect();
                    analytics.report({
                        type: EventType.UnsupportedDevice,
                        payload: { deviceState: 'unsupportedFirmware' },
                    });
                },
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
        if (isConnectedDeviceUninitialized && !wasDeviceEjectedByUser && !isUnacquiredDevice) {
            showAlert({
                title: <Translation id="moduleDevice.noSeedModal.title" />,
                description: <Translation id="moduleDevice.noSeedModal.description" />,
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonVariant: 'tertiaryElevation1',
                primaryButtonTitle: <Translation id="generic.buttons.eject" />,
                appendix: <IncompatibleDeviceModalAppendix />,
                onPressPrimaryButton: () => {
                    handleDisconnect();
                    analytics.report({
                        type: EventType.UnsupportedDevice,
                        payload: { deviceState: 'noSeed' },
                    });
                },
            });
        }
    }, [
        isConnectedDeviceUninitialized,
        isUnacquiredDevice,
        wasDeviceEjectedByUser,
        showAlert,
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
        // Hide the error alert on disconnect of the device
        if (isNoPhysicalDeviceConnected) {
            hideAlert();
        }
    }, [isNoPhysicalDeviceConnected, hideAlert]);
};

import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
    selectIsUnacquiredDevice,
    selectIsConnectedDeviceUninitialized,
    selectIsSelectedDeviceImported,
    acquireDevice,
    selectDevice,
    deviceActions,
    selectIsNoPhysicalDeviceConnected,
    selectIsDeviceInBootloader,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { selectIsFirmwareSupported } from '../selectors';
import { IncompatibleDeviceModalAppendix } from '../components/IncompatibleDeviceModalAppendix';
import { BootloaderModalAppendix } from '../components/BootloaderModalAppendix';
import { UnacquiredDeviceModalAppendix } from '../components/UnacquiredDeviceModalAppendix';

export const useDetectDeviceError = () => {
    const [wasDeviceEjectedByUser, setWasDeviceEjectedByUser] = useState(false);

    const dispatch = useDispatch();
    const { hideAlert, showAlert } = useAlert();
    const { translate } = useTranslate();

    const selectedDevice = useSelector(selectDevice);
    const isUnacquiredDevice = useSelector(selectIsUnacquiredDevice);
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);
    const isSelectedDeviceImported = useSelector(selectIsSelectedDeviceImported);
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);

    const isFirmwareSupported = useSelector(selectIsFirmwareSupported);

    const handleDisconnect = useCallback(() => {
        if (selectedDevice) {
            dispatch(deviceActions.deviceDisconnect(selectedDevice));

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
                title: translate('moduleDevice.unacquiredDeviceModal.title'),
                description: translate('moduleDevice.unacquiredDeviceModal.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: translate('moduleDevice.unacquiredDeviceModal.button'),
                appendix: <UnacquiredDeviceModalAppendix />,
                onPressPrimaryButton: () => dispatch(acquireDevice()),
            });
        } else {
            hideAlert();
        }
    }, [isUnacquiredDevice, translate, dispatch, hideAlert, showAlert]);

    useEffect(() => {
        if (!isFirmwareSupported && !isSelectedDeviceImported && !wasDeviceEjectedByUser) {
            showAlert({
                title: translate('moduleDevice.unsupportedFirmwareModal.title'),
                description: translate('moduleDevice.unsupportedFirmwareModal.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: translate('generic.buttons.eject'),
                primaryButtonVariant: 'tertiaryElevation1',
                appendix: <IncompatibleDeviceModalAppendix />,
                onPressPrimaryButton: handleDisconnect,
            });
        }
    }, [
        isFirmwareSupported,
        isSelectedDeviceImported,
        wasDeviceEjectedByUser,
        dispatch,
        showAlert,
        translate,
        handleDisconnect,
    ]);

    useEffect(() => {
        if (isConnectedDeviceUninitialized && !wasDeviceEjectedByUser && !isUnacquiredDevice) {
            showAlert({
                title: translate('moduleDevice.noSeedModal.title'),
                description: translate('moduleDevice.noSeedModal.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonVariant: 'tertiaryElevation1',
                primaryButtonTitle: translate('generic.buttons.eject'),
                appendix: <IncompatibleDeviceModalAppendix />,
                onPressPrimaryButton: handleDisconnect,
            });
        }
    }, [
        isConnectedDeviceUninitialized,
        isUnacquiredDevice,
        wasDeviceEjectedByUser,
        showAlert,
        translate,
        handleDisconnect,
    ]);

    useEffect(() => {
        if (isDeviceInBootloader && !wasDeviceEjectedByUser) {
            showAlert({
                title: translate('moduleDevice.bootloaderModal.title'),
                description: translate('moduleDevice.bootloaderModal.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonVariant: 'tertiaryElevation1',
                primaryButtonTitle: translate('generic.buttons.eject'),
                appendix: <BootloaderModalAppendix />,
                onPressPrimaryButton: handleDisconnect,
            });
        }
    }, [isDeviceInBootloader, wasDeviceEjectedByUser, showAlert, translate, handleDisconnect]);

    useEffect(() => {
        // Hide the error alert on disconnect of the device
        if (isNoPhysicalDeviceConnected) {
            hideAlert();
        }
    }, [isNoPhysicalDeviceConnected, hideAlert]);
};

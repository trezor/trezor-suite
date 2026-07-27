import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectIsDeviceConnectedViaBluetooth } from '@suite-common/device';
import { type FirmwareUpdateResult, useFirmwareInstallation } from '@suite-common/firmware';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { setPriorityMode } from '@trezor/react-native-usb';

import { nativeFirmwareActions } from '../nativeFirmwareSlice';
import { useFirmwareAnalytics } from './useFirmwareAnalytics';

// If progress doesn't change for 1 minute
const MAYBE_STUCKED_TIMEOUT = 1 * 60 * 1000; // 1 minute

export const useFirmware = (params?: { navigationLocation: 'settings' | 'onboarding' }) => {
    const dispatch = useDispatch();
    const {
        firmwareUpdate: firmwareUpdateCommon,
        confirmOnDevice: confirmOnDeviceCommon,
        operation,
        status,
        error,
        progress,
        setStatus,
        ...firmwareInstallation
    } = useFirmwareInstallation();
    const { translate } = useTranslate();
    const [mayBeStucked, setMayBeStucked] = useState(false);
    const mayBeStuckedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { handleAnalyticsReportStucked } = useFirmwareAnalytics({
        device: firmwareInstallation.originalDevice,
        targetFirmwareType: firmwareInstallation.targetFirmwareType,
        navigationLocation: params?.navigationLocation,
    });

    // When the device is restarted after FW installation via Bluetooth, this flag changes to false
    // for a moment which triggers firmwareUpdate again. => Use ref to prevent this.
    const isDeviceConnectedViaBluetoothRef = useRef(
        useSelector(selectIsDeviceConnectedViaBluetooth),
    );

    const setIsFirmwareInstallationRunning = useCallback(
        (isRunning: boolean) => {
            dispatch(nativeFirmwareActions.setIsFirmwareInstallationRunning(isRunning));
        },
        [dispatch],
    );

    const resetMayBeStuckedTimeout = useCallback(() => {
        if (mayBeStuckedTimeout.current) {
            clearTimeout(mayBeStuckedTimeout.current);
        }
        setMayBeStucked(false);
    }, []);

    const setMayBeStuckedTimeout = useCallback(() => {
        resetMayBeStuckedTimeout();
        mayBeStuckedTimeout.current = setTimeout(() => {
            handleAnalyticsReportStucked('buttonVisible');
            setMayBeStucked(true);
        }, MAYBE_STUCKED_TIMEOUT);
    }, [resetMayBeStuckedTimeout, handleAnalyticsReportStucked]);

    useEffect(() => {
        if (status === 'started' && progress < 100) {
            setMayBeStuckedTimeout();
        }

        return () => {
            resetMayBeStuckedTimeout();
        };
    }, [progress, status, setMayBeStuckedTimeout, resetMayBeStuckedTimeout]);

    const firmwareUpdate = useCallback(async () => {
        if (!isDeviceConnectedViaBluetoothRef.current) {
            setPriorityMode(true);
        }
        const result = await firmwareUpdateCommon({ ignoreBaseUrl: true })
            .unwrap()
            .catch(error => {
                if ((error as FirmwareUpdateResult)?.connectResponse?.success !== undefined) {
                    // This is a firmware update error that is handled by us and we expect promise not to be rejected (for example user cancelled the action on device)
                    return error as FirmwareUpdateResult;
                }
                throw error;
            })
            .then(({ connectResponse }) => connectResponse)
            .finally(() => {
                if (!isDeviceConnectedViaBluetoothRef.current) {
                    setPriorityMode(false);
                }
                resetMayBeStuckedTimeout();
            });

        return result;
    }, [firmwareUpdateCommon, resetMayBeStuckedTimeout]);

    const confirmOnDevice =
        confirmOnDeviceCommon ||
        // This is needed for firmware reinstall to show Confirm on device correctly
        firmwareInstallation.buttonEvent?.code === 'ButtonRequest_Other';

    const translatedText = useMemo(() => {
        let text: { title: TxKeyPath; subtitle?: TxKeyPath } = {
            title: 'firmware.firmwareUpdateProgress.initializing.title',
            subtitle: 'firmware.firmwareUpdateProgress.generalSubtitle',
        };

        const isInitialState = (status === 'started' && operation === null) || status === 'initial';

        if (status === 'error') {
            text = {
                title: 'firmware.firmwareUpdateProgress.error.title',
            };
        } else if (isInitialState && !confirmOnDevice) {
            text = {
                title: 'firmware.firmwareUpdateProgress.initializing.title',
                subtitle: 'firmware.firmwareUpdateProgress.generalSubtitle',
            };
        } else if (isInitialState) {
            text = {
                title: 'firmware.firmwareUpdateProgress.confirming.title',
                subtitle: 'firmware.firmwareUpdateProgress.generalSubtitle',
            };
        } else if (operation === 'completed' || status === 'thp-pairing' || status === 'done') {
            text = {
                title: 'firmware.firmwareUpdateProgress.completed.title',
                subtitle: 'firmware.firmwareUpdateProgress.completed.subtitle',
            };
        } else if (operation === 'restarting') {
            text = {
                title: 'firmware.firmwareUpdateProgress.restarting.title',
                subtitle: 'firmware.firmwareUpdateProgress.generalSubtitle',
            };
        }

        return {
            title: translate(text.title),
            subtitle: text.subtitle ? translate(text.subtitle) : error,
        };
    }, [status, operation, confirmOnDevice, translate, error]);

    return {
        ...firmwareInstallation,
        setIsFirmwareInstallationRunning,
        firmwareUpdate,
        confirmOnDevice,
        translatedText,
        operation,
        status,
        error,
        mayBeStucked,
        progress,
        setStatus,
    };
};

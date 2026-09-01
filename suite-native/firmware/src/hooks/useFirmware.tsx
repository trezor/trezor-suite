import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnectedViaBluetooth } from '@suite-common/device';
import { type FirmwareUpdateResult, useFirmwareInstallation } from '@suite-common/firmware';
import { useDispatch } from '@suite-common/redux-utils';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { setPriorityMode } from '@trezor/react-native-usb';

import { nativeFirmwareActions } from '../nativeFirmwareSlice';
import { useFirmwareAnalytics } from './useFirmwareAnalytics';

// If progress doesn't change for 1 minute
const MAYBE_STUCK_TIMEOUT = 1 * 60 * 1000; // 1 minute

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
    const [mayBeStuck, setMayBeStuck] = useState(false);
    const mayBeStuckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { handleAnalyticsReportStuck } = useFirmwareAnalytics({
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

    const resetMayBeStuckTimeout = useCallback(() => {
        if (mayBeStuckTimeout.current) {
            clearTimeout(mayBeStuckTimeout.current);
        }
        setMayBeStuck(false);
    }, []);

    const setMayBeStuckedTimeout = useCallback(() => {
        resetMayBeStuckTimeout();
        mayBeStuckTimeout.current = setTimeout(() => {
            handleAnalyticsReportStuck('buttonVisible');
            setMayBeStuck(true);
        }, MAYBE_STUCK_TIMEOUT);
    }, [resetMayBeStuckTimeout, handleAnalyticsReportStuck]);

    useEffect(() => {
        if (status === 'started' && progress < 100) {
            setMayBeStuckedTimeout();
        }

        return () => {
            resetMayBeStuckTimeout();
        };
    }, [progress, status, setMayBeStuckedTimeout, resetMayBeStuckTimeout]);

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
                resetMayBeStuckTimeout();
            });

        return result;
    }, [firmwareUpdateCommon, resetMayBeStuckTimeout]);

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
        mayBeStuck,
        progress,
        setStatus,
    };
};

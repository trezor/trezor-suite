import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { waitForConnectedDeviceThunk } from '@suite-common/device';
import {
    type FirmwareUpdateProps,
    firmwareUpdateThunk,
    selectFirmware,
    selectIsFirmwareDeviceLowOnBattery,
    useFirmwareInstallation,
} from '@suite-common/firmware';
import { selectDispatch } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { UI_EVENTS } from '@trezor/connect';

const INTERVAL_CHECK_SLOW_INSTALLATION_MS = 1_000;
const TIME_THRESHOLD_SLOW_INSTALLATION_MS = 30_000;
const PERCENTAGE_THRESHOLD_SLOW_INSTALLATION = 20;

type UseFirmwareDesktopUpdateParams = {
    /**
     * The update finished and this is the device it left us with, re-enumerated and released.
     *
     * Only a caller that owns the device beyond the update has something to do here — the
     * standalone flows, which hand the device back to Suite by selecting it. Onboarding passes
     * nothing: it addresses its own device throughout and selects it when it hands over.
     */
    onUpdateFinished?: (device: TrezorDevice) => void;
};

export const useFirmwareDesktopUpdate = ({
    onUpdateFinished,
}: UseFirmwareDesktopUpdateParams = {}) => {
    const { dispatch } = useServices(selectDispatch);
    const [showLowBatteryModal, setShowLowBatteryModal] = useState(false);
    const firmware = useSelector(selectFirmware);
    const isDeviceConnectedViaBluetoothLowOnBattery = useSelector(
        selectIsFirmwareDeviceLowOnBattery,
    );

    const { firmwareUpdate, originalDevice, reconnectEvent, pinRequested, ...rest } =
        useFirmwareInstallation();

    const [isSlow, setIsSlow] = useState(false);
    const [startTime, setStartTime] = useState<null | number>(null);

    useEffect(() => {
        if (
            !startTime &&
            firmware.uiEvent?.type === UI_EVENTS.FIRMWARE_PROGRESS &&
            firmware.uiEvent.payload.operation === 'start-flashing'
        ) {
            setStartTime(new Date().getTime());
        }
    }, [firmware.uiEvent, startTime]);

    useEffect(() => {
        if (!startTime || isSlow) {
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();

            if (now - startTime > TIME_THRESHOLD_SLOW_INSTALLATION_MS) {
                if (
                    firmware.uiEvent?.type === UI_EVENTS.FIRMWARE_PROGRESS &&
                    firmware.uiEvent.payload.progress < PERCENTAGE_THRESHOLD_SLOW_INSTALLATION
                ) {
                    setIsSlow(true);
                    clearInterval(interval);
                }
            }
        }, INTERVAL_CHECK_SLOW_INSTALLATION_MS);

        return () => clearInterval(interval);
    }, [startTime, isSlow, firmware.uiEvent]);

    const desktopFirmwareUpdate = async (updateProps: FirmwareUpdateProps) => {
        if (isDeviceConnectedViaBluetoothLowOnBattery) {
            setShowLowBatteryModal(true);

            return;
        }

        const updateResult = await firmwareUpdate(updateProps);

        // Only an installation that ran to the end hands the device back. A rejected call is not
        // the end of the flow: it is either a failure the user is now looking at, or a reboot the
        // device could not do by itself and the user is being asked to perform — and in that second
        // case the device reconnecting is the user following instructions, not the update
        // finishing. Selecting and acquiring it there would cut across a flow still in progress.
        if (!firmwareUpdateThunk.fulfilled.match(updateResult)) {
            return;
        }

        // `@trezor/connect` only returns once it has seen the device reconnect and released it, so
        // the update is over — but the store is filled from the connect event, which travels
        // separately, so the device may not be an entry here yet. Wait for it rather than race it.
        //
        // A device that never turns up (an unplugged one, say) times out, and the selection is
        // then left where it is; `selectFirmwareDevice` still resolves the device for the flow's
        // own screens once it reappears.
        const apiType = originalDevice?.descriptor.apiType;

        if (!apiType) {
            return;
        }

        // Where the call started, not where it ended: the response carries the path of the device
        // the method was dispatched on (`core` reads it before the run), so a reboot that
        // re-enumerated the device makes this stale. Kept because it is exact whenever the path did
        // survive; when it did not, the wait falls back to the only device on the transport.
        const { connectResponse } = updateResult.payload;
        const path = connectResponse?.success ? connectResponse.device?.path : undefined;

        const updatedDevice = await dispatch(
            waitForConnectedDeviceThunk({ apiType, path }),
        ).unwrap();

        if (updatedDevice) {
            onUpdateFinished?.(updatedDevice);
        }
    };

    // NOTE: Asume that when the device is restarting back to normal mode and is PIN protected, the PIN will be requested and hence display "device modal"
    const restartingToNormalWithPinProtection =
        rest.operation === 'restarting' &&
        reconnectEvent?.target === 'normal' &&
        originalDevice?.features?.pin_protection &&
        // NOTE: when the device is wiped, the PIN is also wiped
        !rest.deviceWillBeWiped;

    return {
        ...rest,
        originalDevice,
        firmwareUpdate: desktopFirmwareUpdate,
        toggleLowBatteryModal: useCallback(() => setShowLowBatteryModal(prev => !prev), []),
        showLowBatteryModal,
        reconnectEvent,
        showReconnectPrompt: rest.showReconnectPrompt || restartingToNormalWithPinProtection,
        pinRequested: pinRequested || restartingToNormalWithPinProtection,
        isSlow,
    };
};

import { useDispatch } from 'react-redux';

import { FirmwareStatus } from '@suite-common/suite-types';
import {
    checkFirmwareAuthenticity,
    firmwareUpdate,
    selectFirmware,
    firmwareActions,
} from '@suite-common/wallet-core';
import { DEVICE, FirmwareType, UI } from '@trezor/connect';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';

import { useActions, useSelector, useDevice, useTranslation } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { MODAL } from 'src/actions/suite/constants';

export const useFirmware = () => {
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const transport = useSelector(state => state.suite.transport);
    const modal = useSelector(state => state.modal);
    const { device } = useDevice();

    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

    const actions = useActions({
        firmwareUpdate,
        checkFirmwareAuthenticity,
    });

    const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(device);
    const confirmOnDevice =
        (firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT && firmware.uiEvent.payload.bootloader) ||
        (firmware.uiEvent?.type === DEVICE.BUTTON &&
            firmware.uiEvent.payload.code === 'ButtonRequest_FirmwareUpdate');
    const showReconnectPrompt =
        (firmware.uiEvent?.type === DEVICE.BUTTON &&
            firmware.uiEvent.payload.code === 'ButtonRequest_Other') ||
        (firmware.uiEvent?.type === DEVICE.BUTTON &&
            firmware.uiEvent.payload.code === 'ButtonRequest_ProtectCall') ||
        (firmware.uiEvent?.type === UI.FIRMWARE_DISCONNECT && firmware.uiEvent.payload.manual) ||
        (firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
            firmware.uiEvent.payload.manual &&
            firmware.uiEvent.payload.confirmOnDevice) ||
        (device?.mode === 'bootloader' &&
            firmware.status === 'error' &&
            firmware.error === 'Firmware install cancelled' &&
            firmware.uiEvent?.type === DEVICE.BUTTON &&
            firmware.uiEvent.payload.code === 'ButtonRequest_FirmwareUpdate');
    const showConfirmationPill =
        !showReconnectPrompt &&
        !!firmware.uiEvent &&
        !(
            firmware.uiEvent.type === UI.FIRMWARE_PROGRESS &&
            firmware.uiEvent.payload.operation === 'downloading'
        );

    const getUpdateStatus = () => {
        if (firmware.status === 'done') {
            return {
                operation: translationString('TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED'),
                progress: 100,
            };
        }
        if (firmware.uiEvent?.type === UI.FIRMWARE_PROGRESS) {
            switch (firmware.uiEvent.payload.operation) {
                case 'flashing':
                    return {
                        operation: translationString('TR_INSTALLING'),
                        progress: firmware.uiEvent.payload.progress,
                    };
                case 'validating':
                    return {
                        operation: translationString('TR_VALIDATION'),
                        progress: 100,
                    };
            }
        }
        if (
            (firmware.uiEvent?.type === UI.FIRMWARE_DISCONNECT &&
                !firmware.uiEvent.payload.manual) ||
            (firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
                !firmware.uiEvent.payload.bootloader)
        ) {
            return { operation: translationString('TR_WAIT_FOR_REBOOT'), progress: 100 };
        }

        return { operation: null, progress: 0 };
    };

    const getTargetFirmwareType = (shouldSwitchFirmwareType: boolean) => {
        const isBitcoinOnlyAvailable = !!device?.firmwareRelease?.release.url_bitcoinonly;

        return (isCurrentlyBitcoinOnly && !shouldSwitchFirmwareType) ||
            // switching to Bitcoin-only
            (!isCurrentlyBitcoinOnly && shouldSwitchFirmwareType && isBitcoinOnlyAvailable) ||
            // Bitcoin-only device
            isBitcoinOnlyDevice(device)
            ? FirmwareType.BitcoinOnly
            : FirmwareType.Regular;
    };

    return {
        ...firmware,
        ...actions,
        ...getUpdateStatus(),
        toggleHasSeed: () => dispatch(firmwareActions.toggleHasSeed()),
        setStatus: (status: FirmwareStatus | 'error') =>
            dispatch(firmwareActions.setStatus(status)),
        resetReducer: () => dispatch(firmwareActions.resetReducer()),
        isWebUSB: isWebUsb(transport),
        showFingerprintCheck,
        getTargetFirmwareType,
        confirmOnDevice,
        showReconnectPrompt,
        showConfirmationPill,
    };
};
